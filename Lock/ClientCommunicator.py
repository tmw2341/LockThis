#!/usr/bin/python           # This is client.py file

import socket               # Import socket module

class Communicator:

    def checkStatus(self):
        '''
        Creates a Socket with weatherwatch.ece.iastate.edu on Port 8000
        '''
        sock_sender = socket.socket(socket.AF_INET, socket.SOCK_STREAM)       #Create Sockets
        PORT = 9090                       #Default PORT and HOSTNAME
        HOSTNAME = "lockthis.ece.iastate.edu"
        Lock_Id = "1"
        print("Connecting to " + HOSTNAME + "\n\n")
        sock_sender.connect((HOSTNAME, PORT))  #connect to the server
        sock_sender.send(Lock_Id) #Ack the server
        status = sock_sender.recv(1024)  #Get status
        sock_sender.close()   #Disconnect from Server
        return status
