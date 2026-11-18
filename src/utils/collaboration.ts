import { PeerCursor, CSVNode, ConnectorArrow } from '@/types';

export interface CollabMessage {
  type: 'CURSOR_MOVE' | 'SYNC_NODES' | 'SYNC_ARROWS' | 'PEER_JOIN';
  senderId: string;
  senderName: string;
  senderColor: string;
  payload?: any;
}

const PEER_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export class CollabManager {
  private channel: BroadcastChannel | null = null;
  public myId: string;
  public myName: string;
  public myColor: string;
  private onCursorCallback?: (cursor: PeerCursor) => void;
  private onSyncNodesCallback?: (nodes: CSVNode[]) => void;
  private onSyncArrowsCallback?: (arrows: ConnectorArrow[]) => void;

  constructor() {
    this.myId = `peer-${Math.random().toString(36).substring(2, 8)}`;
    this.myName = `User ${this.myId.slice(-3).toUpperCase()}`;
    this.myColor = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('planecsv_sync_channel');
      this.channel.onmessage = (event: MessageEvent<CollabMessage>) => {
        this.handleMessage(event.data);
      };

      // Announce join
      this.sendMessage({
        type: 'PEER_JOIN',
        senderId: this.myId,
        senderName: this.myName,
        senderColor: this.myColor,
      });
    }
  }

  private handleMessage(msg: CollabMessage) {
    if (!msg || msg.senderId === this.myId) return;

    if (msg.type === 'CURSOR_MOVE' && this.onCursorCallback) {
      this.onCursorCallback({
        id: msg.senderId,
        name: msg.senderName,
        color: msg.senderColor,
        x: msg.payload.x,
        y: msg.payload.y,
        lastActive: Date.now(),
      });
    } else if (msg.type === 'SYNC_NODES' && this.onSyncNodesCallback) {
      this.onSyncNodesCallback(msg.payload);
    } else if (msg.type === 'SYNC_ARROWS' && this.onSyncArrowsCallback) {
      this.onSyncArrowsCallback(msg.payload);
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
      // Ignore
    }
  }

  public onCursor(callback: (cursor: PeerCursor) => void) {
    this.onCursorCallback = callback;
  }

  public onSyncNodes(callback: (nodes: CSVNode[]) => void) {
    this.onSyncNodesCallback = callback;
  }

  public onSyncArrows(callback: (arrows: ConnectorArrow[]) => void) {
    this.onSyncArrowsCallback = callback;
  }

  public destroy() {
    this.channel?.close();
  }
}
