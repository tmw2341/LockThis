import socket
import sys
import WWMySQLConn as dbconn

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bind the socket to the port
server_address = ('', 8000)
print('starting up on {} port {}'.format(*server_address))
sock.bind(server_address)

# Listen for incoming connections
sock.listen(5)

dbconn.query()
print("ran query! Hopefully shit printed above me! :/")

while True:
    # Wait for a connection
    print('waiting for a connection')
    connection, client_address = sock.accept()

    try:
        print('connection from', client_address)

        # Receive the data in small chunks and retransmit it
        while True:
            #TODO keep track of the amount of data that has been received
            #TODO this number could/should increase to 1024 but ETG example had it at 16
            data = connection.recv(1024)
            print('received {!r}'.format(data))
            #TODO Should ACK 'OK'
            if data:
                print('sending data back to the client')
                connection.sendall(data)
            else:
                print('no data from', client_address)
                break

    finally:
        # Clean up the connection
        connection.close()
