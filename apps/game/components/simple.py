import json
import logging
import requests

from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from tornado import gen

from ..player import Player
from ..protocol import Protocol as Pt
from ..rule import rule


class AiPlayer(Player):

    def __init__(self, uid: int, username: str, player: Player):
        from ..views import LoopBackSocketHandler
        super().__init__(uid, username, LoopBackSocketHandler(self))
        self.room = player.room
        self.ai_addr = 'http://127.0.0.1:5000/'

    def to_server(self, message):
        packet = json.dumps(message)
        IOLoop.current().add_callback(self.socket.on_message, packet)
        logging.info('AI[%d] REQ: %s', self.uid, message)

    def from_server(self, packet):
        logging.info('AI[%d] ON: %s', self.uid, packet)
        code = packet[0]
        if code == Pt.RSP_LOGIN:
            pass
        elif code == Pt.RSP_TABLE_LIST:
            pass
        elif code == Pt.RSP_JOIN_TABLE:
            pass
        elif code == Pt.RSP_DEAL_POKER:
            if self.uid == packet[1]:
                self.auto_call_score()
        elif code == Pt.RSP_CALL_SCORE:
            if self.table.turn_player == self:
                call_end = packet[3]
                if not call_end:
                    self.auto_call_score()
                else:
                    self.auto_shot_poker()
        elif code == Pt.RSP_SHOW_POKER:
            if self.table.turn_player == self:
                self.auto_shot_poker()
        elif code == Pt.RSP_SHOT_POKER and not packet[3]:
            if self.table.turn_player == self:
                self.auto_shot_poker()
        elif code == Pt.RSP_GAME_OVER:
            winner = packet[1]
            coin = packet[2]
            IOLoop.current().add_callback(self.to_server, [Pt.REQ_RESTART])
        else:
            logging.info('AI ERROR PACKET: %s', packet)

    def auto_call_score(self, score=0):
        # millis = random.randint(1000, 2000)
        # score = random.randint(min_score + 1, 3)
        # print('auto_call_score:%d'%self.uid)

        # change call score policy of ai here 
        packet = [Pt.REQ_CALL_SCORE, self.table.call_score + 1]
        IOLoop.current().add_callback(self.to_server, packet)

    def auto_shot_poker(self):
        pokers = []
        body = {
            'role_id': self.role
        }
        
        logging.info(self.hand_pokers)
        body['cur_cards'] = self.change_card_type(self.hand_pokers)
        history = {}
        lefts = {}
        last_takens = {}
        for player in self.table.players:
            h = player.table.history[player.seat]
            l = len(player.hand_pokers)
            history[player.role] = self.change_card_type(h)
            lefts[player.role] = l
            last_takens[player.role] = self.change_card_type(player.handout_pokers[-1])
        logging.info(self.table.last_shot_poker)
        body['history'] = history
        body['left'] = lefts
        body['last_taken'] = last_takens
        # if not self.table.last_shot_poker or self.table.last_shot_seat == self.seat:
        #     body['last_taken'] = []
        # else:
        #     body['last_taken'] = self.change_card_type(self.table.last_shot_poker)
        print(body)
        #self.f()
        res = requests.post(self.ai_addr, json=body)
        res = json.loads(res.content)
        need_cards = res['data']
        print(need_cards)
        # 将于俊返回的牌表示为服务器端的表示形式
        used = set()
        for need_card in need_cards:
            # print(need_card)
            if need_card == 17 and 53 in self.hand_pokers:
                pokers.append(53)
            elif need_card == 16 and 52 in self.hand_pokers:
                pokers.append(52)
            elif need_card < 16:
                if need_card == 14 or need_card == 15:
                    need_card -= 14
                else:
                    need_card -= 1
                for candidate in [need_card, need_card + 13, need_card + 13 * 2, need_card + 13 * 3]:
                    if candidate in self.hand_pokers and candidate not in used:
                        pokers.append(candidate)
                        used.add(candidate)
                        break
        # print(pokers)
        packet = [Pt.REQ_SHOT_POKER, pokers]
        # IOLoop.current().add_callback(self.to_server, packet)
        IOLoop.current().call_later(2, self.to_server, packet)

    # 和于俊对接需要把牌的表示方法换一下
    def change_card_type(self,cards):
        res = []
        # print(cards)
        for card in cards:
            if card == 52:
                res.append(16)
            elif card == 53:
                res.append(17)
            else:
                tmp = card%13 + 1
                if tmp == 1 or tmp == 2:
                    tmp = tmp + 13
                res.append(tmp)
        # print(res)
        return res
