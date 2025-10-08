import asyncio
import random
import websockets

# Global set to hold all connected client websockets
connected_clients = set()

# Configuration parameters
PORT = 81

# Heartbeat simulation parameters
# Base heart rate around 70 BPM, with occasional spikes up to 150 BPM.
current_bpm = 70

# Leads status
leads_connected = True

async def broadcast(message: str):
    """Send a message to all connected clients."""
    if connected_clients:  # Only broadcast if clients are connected
        # Use asyncio.gather instead of asyncio.wait
        await asyncio.gather(*(client.send(message) for client in connected_clients))
    print(message)

async def heartbeat_simulator():
    """
    Simulate ECG heart beats.
    Normally, the BPM hovers around 70.
    Occasionally, a spike event is triggered where the BPM jumps between 110 and 150 for a few beats.
    The heartbeat interval is determined by the current BPM.
    """
    global current_bpm
    # A counter to track the remaining beats during a spike event.
    spike_beats_remaining = 0

    while True:
        if spike_beats_remaining > 0:
            # During a spike event, choose a BPM between 110 and 150.
            current_bpm = random.randint(110, 150)
            spike_beats_remaining -= 1
        else:
            # Not spiking: normally keep around 70 BPM with slight variation.
            current_bpm = random.randint(65, 75)
            # Randomly trigger a spike event with a 5% chance per beat.
            if random.random() < 0.05:
                spike_beats_remaining = random.randint(3, 8)  # spike lasts for 3-8 beats

        # Broadcast the BPM message.
        message = f"bpm:{int(current_bpm)}"
        await broadcast(message)

        # Wait for the next heartbeat based on the current BPM (60 sec / BPM)
        interval = 60.0 / current_bpm
        await asyncio.sleep(interval)

async def leads_simulator():
    """
    Occasionally simulate the leads disconnecting and reconnecting.
    The leads will disconnect randomly every 20-40 seconds,
    then reconnect after a short period (3-5 seconds).
    """
    global leads_connected
    while True:
        # Wait a random interval before simulating a disconnect event.
        await asyncio.sleep(random.uniform(20, 40))

        # Simulate leads disconnecting.
        if leads_connected:
            leads_connected = False
            await broadcast("leads:disconnected")
            # Leads stay disconnected for 3-5 seconds.
            await asyncio.sleep(random.uniform(3, 5))
            # Then reconnect.
            leads_connected = True
            await broadcast("leads:ok")

async def handler(websocket, path):
    """
    Register a client, then keep the connection open.
    If the connection is closed, remove the client from our set.
    """
    # Add new client connection.
    connected_clients.add(websocket)
    client_address = websocket.remote_address
    print(f"Client connected: {client_address}")

    try:
        # Keep connection alive; you could also process incoming messages here.
        async for message in websocket:
            # For now, just print any messages received from the client.
            print(f"Received message from {client_address}: {message}")
    except websockets.ConnectionClosed:
        pass
    finally:
        # Remove the client when the connection is closed.
        connected_clients.remove(websocket)
        print(f"Client disconnected: {client_address}")

async def main():
    # Start the websocket server.
    server = await websockets.serve(handler, "0.0.0.0", PORT)
    print(f"WebSocket server started on port {PORT}")

    # Schedule both simulation tasks concurrently.
    await asyncio.gather(
        heartbeat_simulator(),
        leads_simulator(),
    )

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server shut down.")
