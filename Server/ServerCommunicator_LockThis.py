#!/usr/bin/python           # This is client.py file

import socket
import sys
from DBConn import DataBase

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bind the socket to the port
server_address = ('', 9090)
print('starting up on {} port {}'.format(*server_address))
sock.bind(server_address)

# Listen for incoming connections
sock.listen(5)

while True:
    # Wait for a connection
    print('waiting for a connection')
    connection, client_address = sock.accept()
    try:
        print('connection from', client_address)
        lock_id = connection.recv(1024)
        db = DataBase()
        status = db.checkStatus(lock_id)
        if status == None:
            #ToDo send an error
            print("Lock_Id not found: " + lock_id)
        else:
            print(status)
            connection.sendall(str(status).encode())

    finally:
        # Clean up the connection
        connection.close()
