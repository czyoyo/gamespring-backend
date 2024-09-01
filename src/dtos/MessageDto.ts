export class CreateMessageDto {
  content: string;
  receiverId?: string;
  roomId: string;
}

export class MessageResponseDto {
  id?: number;
  content: string;
  sender: { id: number; username: string };
  receiver?: { id: number; username: string };
  createdAt: Date;
  type?: string;
  roomId?: string;
  // 이전 채팅 내용을 가져오기 위해 추가
  previousMessageId?: number;
}
