import fs from 'fs';
import path from 'path';

// 로그 파일 경로
const logFilePath = path.join(__dirname, '../../logs/chat-log-file.txt');

// 메시지 저장
export const logMessageToFile = (message: string) => {
  fs.appendFile(logFilePath, `${message}\n`, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};






