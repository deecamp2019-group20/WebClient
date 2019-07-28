import functools
import json
import logging

from tornado.escape import json_decode
from tornado.ioloop import IOLoop
from tornado.web import authenticated
from tornado.websocket import WebSocketHandler, WebSocketClosedError

from contrib.db import AsyncConnection
from .player import Player
from .protocol import Protocol as Pt
from .room import RoomManager


def shot_turn(method):
    @functools.wraps(method)
    def wrapper(socket, packet):
        if socket.player.seat == socket.player.table.whose_turn:
            method(socket, packet)
        else:
            logging.warning('Player[%d] TURN CHEAT', socket.uid)

    return wrapper


class SocketHandler(WebSocketHandler):

    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.db: AsyncConnection = self.application.db
        self.player: Player = None

    def data_received(self, chunk):
        logging.info('socket data_received')

    def get_current_user(self):
        return json_decode(self.get_secure_cookie("user"))

    @property
    def uid(self):
        return self.player.uid

    @property
    def room(self):
        return self.player.room

    @authenticated
    def open(self):
        user = self.current_user
        self.player = Player(user['uid'], user['username'], self)
        logging.info('SOCKET[%s] OPEN', self.player.uid)

    def on_close(self):
        self.player.leave_table()
        logging.info('SOCKET[%s] CLOSE', self.player.uid)

    async def on_message(self, message):
        packet = json.loads(message)
        logging.info('REQ[%d]: %s', self.uid, packet)

        code = packet[0]
        if code == Pt.REQ_LOGIN:
            response = [Pt.RSP_LOGIN, self.player.uid, self.player.name]
            self.write_message(response)

        elif code == Pt.REQ_ROOM_LIST:
            self.write_message([Pt.RSP_ROOM_LIST])

        elif code == Pt.REQ_TABLE_LIST:
            self.write_message([Pt.RSP_TABLE_LIST, self.room.rsp_tables()])

        elif code == Pt.REQ_JOIN_ROOM:
            self.player.room = RoomManager.find_room(packet[1])
            self.write_message([Pt.RSP_JOIN_ROOM, self.room.rsp_tables()])

        elif code == Pt.REQ_NEW_TABLE:
            # TODO: check player was already in table.
            table = self.room.new_table()
            self.player.join_table(table)
            logging.info('PLAYER[%s] NEW TABLE[%d]', self.uid, table.uid)
            self.write_message([Pt.RSP_NEW_TABLE, table.uid])

        elif code == Pt.REQ_JOIN_TABLE:
            table = self.room.find_waiting_table(packet[1])
            if not table:
                self.write_message([Pt.RSP_TABLE_LIST, self.room.rsp_tables()])
                logging.info('PLAYER[%d] JOIN TABLE[%d] NOT FOUND', self.uid, packet[1])
                return

            self.player.join_table(table)
            logging.info('PLAYER[%s] JOIN TABLE[%d]', self.uid, table.uid)
            if table.is_full():
                table.deal_poker()
                self.room.on_table_changed(table)
                logging.info('TABLE[%s] GAME BEGIN[%s]', table.uid, table.players)

        elif code == Pt.REQ_CALL_SCORE:
            self.handle_call_score(packet)

        elif code == Pt.REQ_DEAL_POKER:
            if self.player.table.state == 2:
                self.player.ready = True
            self.player.table.ready()

        elif code == Pt.REQ_SHOT_POKER:
            self.handle_shot_poker(packet)
        elif code == Pt.REQ_CHAT:
            self.handle_chat(packet)
        elif code == Pt.REQ_CHEAT:
            self.handle_cheat(packet[1])
        elif code == Pt.REQ_RESTART:
            self.player.table.reset()
        else:
            logging.info('UNKNOWN PACKET: %s', code)

    @shot_turn
    def handle_call_score(self, packet):
        score = packet[1]
        self.player.handle_call_score(score)

    @shot_turn
    def handle_shot_poker(self, packet):
        pokers = packet[1]
        self.player.handle_shot_poker(pokers)

    def handle_chat(self, packet):
        if self.player.table:
            self.player.table.handle_chat(self.player, packet[1])

    def handle_cheat(self, uid):
        for p in self.player.table.players:
            if p.uid == uid:
                self.player.send([Pt.RSP_CHEAT, p.uid, p.hand_pokers])

    def write_message(self, message, binary=False):
        if self.ws_connection is None:
            raise WebSocketClosedError()
        logging.info('RSP[%d]: %s', self.uid, message)
        packet = json.dumps(message)
        return self.ws_connection.write_message(packet, binary=binary)

    def send_updates(cls, chat):
        logging.info('sending message to %d waiters', len(cls.waiters))
        for waiter in cls.waiters:
            waiter.write_message('tornado:' + chat)


class LoopBackSocketHandler(SocketHandler):

    def __init__(self, player):
        self.player = player

    def write_message(self, message, binary=True):
        IOLoop.current().add_callback(self._write_message, message)
        return True

    def _write_message(self, packet):
        self.player.from_server(packet)
