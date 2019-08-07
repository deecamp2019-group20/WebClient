import logging
import random
from typing import List

from tornado.ioloop import IOLoop

from .player import Player
from .protocol import Protocol as Pt
from .components.simple import AiPlayer


class Table(object):

    WAITING = 0
    PLAYING = 1
    END = 2
    CLOSED = 3

    def __init__(self, uid, room):
        self.uid = uid
        self.room = room
        self.players: List[Player] = [None, None, None]
        self.state = 0  # 0 waiting  1 playing 2 end 3 closed
        self.pokers: List[int] = []
        self.multiple = 1
        self.call_score = 0
        self.max_call_score = 0
        self.max_call_score_turn = 0
        self.whose_turn = 0
        self.last_shot_seat = 0
        self.last_shot_poker = []
        self.history = [None, None, None]
        self.last_winner = -1
        self.score_history = []
        if room.allow_robot:
            IOLoop.current().call_later(0.1, self.ai_join, nth=1)

    def reset(self):
        
        self.pokers: List[int] = []
        self.multiple = 1
        self.call_score = 0
        self.max_call_score = 0
        self.max_call_score_turn = 0
        self.score_history = []
        self.history = [[], [], []]
        if self.last_winner != -1:
            self.whose_turn = self.last_winner
        else:
            self.whose_turn = 0
        self.last_shot_seat = 0
        self.last_shot_poker = []
        for player in self.players:
            # player.join_table(self)
            player.reset()
        if self.is_full():
            self.deal_poker()
            self.room.on_table_changed(self)
            logging.info('TABLE[%s] GAME BEGIN[%s]', self.uid, self.players[0].uid)

    def ai_join(self, nth=1):
        size = self.size()
        if size == 0 or size == 3:
            return

        if size == 2 and nth == 1:
            IOLoop.current().call_later(1, self.ai_join, nth=2)

        logging.info('***************************************88')
        logging.info(self.players[0].uid)

        p1 = AiPlayer(998997991, 'IDIOT-I', self.players[0])
        p1.to_server([Pt.REQ_JOIN_TABLE, self.uid])

        if size == 1:
            p2 = AiPlayer(998997992, 'IDIOT-II', self.players[0])
            p2.to_server([Pt.REQ_JOIN_TABLE, self.uid])

    def sync_table(self):
        ps = []
        for p in self.players:
            if p:
                ps.append((p.uid, p.name))
            else:
                ps.append((-1, ''))
        response = [Pt.RSP_JOIN_TABLE, self.uid, ps]
        for player in self.players:
            if player:
                player.send(response)

    def deal_poker(self):
        # if not all(p and p.ready for p in self.players):
        #     return

        self.state = Table.PLAYING
        self.pokers = [i for i in range(54)]
        random.shuffle(self.pokers)
        for i in range(51):
            self.players[i % 3].hand_pokers.append(self.pokers.pop())
        for i in range(3):
            print('---------------------------------------')
            print(self.players[i].hand_pokers)
        #self.whose_turn = random.randint(0, 2)
        if self.last_winner != -1:
            self.whose_turn = self.last_winner
        else:
            self.whose_turn = 0
        # print('whose_turn----------------------------')
        # print(self.turn_player)
        logging.info('*********************************')
        logging.info(self.turn_player.uid)
        logging.info(self.whose_turn)
        for p in self.players:
            p.hand_pokers.sort()
            
            response = [Pt.RSP_DEAL_POKER, self.turn_player.uid, p.hand_pokers]
            p.send(response)

    def call_score_end(self):
        self.call_score = self.max_call_score
        self.whose_turn = self.max_call_score_turn

        # 1代表地主,2代表地主下家，0代表地主上家
        self.turn_player.role = 1
        self.players[(self.whose_turn+1)%3].role = 2
        self.players[(self.whose_turn+2)%3].role = 0

        self.turn_player.hand_pokers += self.pokers
        response = [Pt.RSP_SHOW_POKER, self.turn_player.uid, self.pokers]
        for p in self.players:
            p.send(response)
        logging.info('Player[%d] IS LANDLORD[%s]', self.turn_player.uid, str(self.pokers))

    def go_next_turn(self):
        self.whose_turn += 1
        if self.whose_turn == 3:
            self.whose_turn = 0

    @property
    def turn_player(self):
        return self.players[self.whose_turn]

    def handle_chat(self, player, msg):
        response = [Pt.RSP_CHAT, player.uid, msg]
        for p in self.players:
            p.send(response)

    def on_join(self, player):
        if self.is_full():
            logging.error('Player[%d] JOIN Table[%d] FULL', player.uid, self.uid)
        for i, p in enumerate(self.players):
            if not p:
                player.seat = i
                self.players[i] = player
                self.history[i] = []
                break
        self.sync_table()

    def on_leave(self, player):
        for i, p in enumerate(self.players):
            if p == player:
                self.players[i] = None
                self.history[i] = None
                break

    def _uid2seat(self,uid):
        for i,p in enumerate(self.players):
            if uid == p.uid:
                return i
        return -1

    def on_game_over(self, winner):
        # if winner.hand_pokers:
        #     return
        print('winner----------------------------')
        print(self._uid2seat(winner.uid))
        self.last_winner = self._uid2seat(winner.uid)
        coin = self.room.entrance_fee * self.call_score * self.multiple
        for p in self.players:
            response = [Pt.RSP_GAME_OVER, winner.uid, coin if p != winner else coin * 2 - 100]
            for pp in self.players:
                if pp != p:
                    response.append([pp.uid, *pp.hand_pokers])
            p.send(response)
        # TODO deduct coin from database
        # TODO store poker round to database
        logging.info('Table[%d] GameOver[%d]', self.uid, self.uid)

    def remove(self, player):
        for i, p in enumerate(self.players):
            if p and p.uid == player.uid:
                self.players[i] = None
                self.history[i] = None
        else:
            logging.error('Player[%d] NOT IN Table[%d]', player.uid, self.uid)

        if all(p is None for p in self.players):
            self.state = 3
            logging.error('Table[%d] close', self.uid)
            return True
        return False

    def is_full(self):
        return self.size() == 3

    def is_empty(self):
        return self.size() == 0

    def size(self):
        return sum([p is not None for p in self.players])

    def __str__(self):
        return '[{}: {}]'.format(self.uid, self.players)

    def all_called(self):
        for p in self.players:
            if not p.is_called:
                return False
        return True


