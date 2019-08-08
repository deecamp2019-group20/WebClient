import bcrypt

from contrib.handlers import BaseHandler
from tornado.escape import json_encode
import uuid

class HomeHandler(BaseHandler):

    async def get(self):
        # 直接通过ip登陆，免去注册和登陆
        if not self.get_cookie("_csrf"):
            self.set_cookie("_csrf", self.xsrf_token)
        
        ip = self.client_ip
        user_id = await self.db.fetchone('SELECT id FROM user WHERE ip=%s', ip)
        if user_id is None:
            user_id = await self.db.insert('INSERT INTO user (ip) VALUES (%s)',
                                ip)
        if type(user_id) != int:
            user_id = user_id['id']
        info = {
            'uid': user_id,
            'username': str(uuid.uuid1()),
        }
        user = json_encode(info)
        self.set_secure_cookie('user', user)
        self.render('poker.html', user=user)


class SignupHandler(BaseHandler):

    async def post(self):
        email = self.get_query_params('email', self.get_query_params('username'))
        account = await self.db.fetchone('SELECT id FROM account WHERE email=%s', email)
        if account:
            self.write({'errcode': 1, 'errmsg': 'The email has already exist'})
            return

        username = self.get_query_params('username')
        password = self.get_query_params('password')
        password = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt())

        uid = await self.db.insert('INSERT INTO account (email, username, password, ip_addr) VALUES (%s, %s, %s, %s)',
                                   email, username, password, self.client_ip)
        self.set_current_user(uid, username)
        self.set_header('Content-Type', 'application/json')
        response = {
            'errcode': 0,
            'userinfo': {'uid': uid, 'username': username}
        }
        self.write(response)


class LoginHandler(BaseHandler):

    async def post(self):
        email = self.get_argument('email')
        password = self.get_argument("password")
        account = await self.db.fetchone('SELECT * FROM account WHERE email=%s', email)
        password = bcrypt.hashpw(password.encode('utf8'), account.get('password'))

        self.set_header('Content-Type', 'application/json')
        if password == account.get('password'):
            self.set_current_user(account.get('id'), account.get('username'))
            self.redirect(self.get_argument("next", "/"))


class LogoutHandler(BaseHandler):

    def post(self):
        self.clear_cookie('user')
        self.redirect(self.get_argument("next", "/"))
