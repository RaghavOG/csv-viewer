import { PeerCursor, CSVNode, ConnectorArrow } from '@/types';

export interface CollabMessage {
  type: 'CURSOR_MOVE' | 'SYNC_NODES' | 'SYNC_ARROWS' | 'PEER_JOIN' | 'PEER_ACK' | 'PEER_LEAVE' | 'HEARTBEAT';
  senderId: string;
  senderName: string;
  senderColor: string;
  payload?: any;
}

const PEER_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#3b82f6', // Blue
];

export class CollabManager {
  private channel: BroadcastChannel | null = null;
  public myId: string;
  public myName: string;
  public myColor: string;
  private onCursorCallback?: (cursor: PeerCursor) => void;
  private onPeerJoinCallback?: (peer: PeerCursor) => void;
  private onPeerLeaveCallback?: (peerId: string) => void;
  private onSyncNodesCallback?: (nodes: CSVNode[]) => void;
  private onSyncArrowsCallback?: (arrows: ConnectorArrow[]) => void;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor() {
    this.myId = `peer-${Math.random().toString(36).substring(2, 8)}`;
    this.myName = `User ${this.myId.slice(-3).toUpperCase()}`;
    this.myColor = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('csvee_sync_channel');
      this.channel.onmessage = (event: MessageEvent<CollabMessage>) => {
        this.handleMessage(event.data);
      };

      // Announce join immediately to all peers
      this.sendMessage({
        type: 'PEER_JOIN',
        senderId: this.myId,
        senderName: this.myName,
        senderColor: this.myColor,
      });

      // Handle graceful leave on window close / tab refresh
      const handleBeforeUnload = () => {
        this.sendMessage({
          type: 'PEER_LEAVE',
          senderId: this.myId,
          senderName: this.myName,
          senderColor: this.myColor,
        });
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);

      // Periodic heartbeat every 2 seconds to maintain active presence
      this.heartbeatInterval = setInterval(() => {
        this.sendMessage({
          type: 'HEARTBEAT',
          senderId: this.myId,
          senderName: this.myName,
          senderColor: this.myColor,
        });
      }, 2000);
    }
  }

  private handleMessage(msg: CollabMessage) {
    if (!msg || msg.senderId === this.myId) return;

    switch (msg.type) {
      case 'PEER_JOIN': {
        // Register new peer
        this.onPeerJoinCallback?.({
          id: msg.senderId,
          name: msg.senderName,
          color: msg.senderColor,
          x: 0,
          y: 0,
          lastActive: Date.now(),
        });
        // Respond with ACK so the joining peer immediately discovers us
        this.sendMessage({
          type: 'PEER_ACK',
          senderId: this.myId,
          senderName: this.myName,
          senderColor: this.myColor,
        });
        break;
      }

      case 'PEER_ACK': {
        // Register existing peer who acknowledged us
        this.onPeerJoinCallback?.({
          id: msg.senderId,
          name: msg.senderName,
          color: msg.senderColor,
          x: 0,
          y: 0,
          lastActive: Date.now(),
        });
        break;
      }

      case 'PEER_LEAVE': {
        this.onPeerLeaveCallback?.(msg.senderId);
        break;
      }

      case 'HEARTBEAT': {
        this.onPeerJoinCallback?.({
          id: msg.senderId,
          name: msg.senderName,
          color: msg.senderColor,
          x: 0,
          y: 0,
          lastActive: Date.now(),
        });
        break;
      }

      case 'CURSOR_MOVE': {
        if (this.onCursorCallback && msg.payload) {
          this.onCursorCallback({
            id: msg.senderId,
            name: msg.senderName,
            color: msg.senderColor,
            x: msg.payload.x,
            y: msg.payload.y,
            lastActive: Date.now(),
          });
        }
        break;
      }

      case 'SYNC_NODES': {
        if (this.onSyncNodesCallback && Array.isArray(msg.payload)) {
          this.onSyncNodesCallback(msg.payload);
        }
        break;
      }

      case 'SYNC_ARROWS': {
        if (this.onSyncArrowsCallback && Array.isArray(msg.payload)) {
          this.onSyncArrowsCallback(msg.payload);
        }
        break;
      }
    }
  }

  public sendCursor(x: number, y: number) {
    this.sendMessage({
      type: 'CURSOR_MOVE',
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      payload: { x, y },
    });
  }

  public broadcastNodes(nodes: CSVNode[]) {
    this.sendMessage({
      type: 'SYNC_NODES',
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      payload: nodes,
    });
  }

  public broadcastArrows(arrows: ConnectorArrow[]) {
    this.sendMessage({
      type: 'SYNC_ARROWS',
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      payload: arrows,
    });
  }

  private sendMessage(msg: CollabMessage) {
    try {
      this.channel?.postMessage(msg);
    } catch {
      // Ignore channel errors
    }
  }

  public onCursor(callback: (cursor: PeerCursor) => void) {
    this.onCursorCallback = callback;
  }

  public onPeerJoin(callback: (peer: PeerCursor) => void) {
    this.onPeerJoinCallback = callback;
  }

  public onPeerLeave(callback: (peerId: string) => void) {
    this.onPeerLeaveCallback = callback;
  }

  public onSyncNodes(callback: (nodes: CSVNode[]) => void) {
    this.onSyncNodesCallback = callback;
  }

  public onSyncArrows(callback: (arrows: ConnectorArrow[]) => void) {
    this.onSyncArrowsCallback = callback;
  }

  public destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.sendMessage({
      type: 'PEER_LEAVE',
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
    });
    this.channel?.close();
  }
}
