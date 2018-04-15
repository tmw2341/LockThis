#!/usr/bin/python           # This is client.py file

import time
from ClientCommunicator import Communicator
from servosix.python.servosix import ServoSix

status = False;
ss = ServoSix()
servo = 1
ss.set_servo(servo,0)

communicator = Communicator()

try:
    while True:
        #check status w/ db
        new_status = communicator.checkStatus()
        print(new_status != status)

        if new_status != status:
            if new_status:
                angle = 150
                ss.set_servo(servo, angle)
            else:
                angle = 0
                ss.set_servo(servo,angle)

        status = new_status
        time.sleep(5) #Sleep for 5 seconds then check status again

finally:
    ss.cleanup()
