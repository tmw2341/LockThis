#!/usr/bin/python           # This is client.py file

from sqlite3 import dbapi2 as sqlite


class DataBase:

    def checkStatus(self, lock_id):
        #print("Connecting to DB")
        conn = sqlite.connect("/home/vm-user/Server/AlexaDatabase")
        #print("Connected to DB")
        #print("Creating Cursor")
        cur = conn.cursor()
        cmd = "select status from locks where id = " + str(lock_id) + ";"
        #print("Executing")
        cur.execute(cmd)
        status = cur.fetchone()
        return status[0]
