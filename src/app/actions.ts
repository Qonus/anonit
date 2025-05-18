export interface IMessage {
    content: string,
    isUser: boolean,
    files: IUploadingFile[],
}

export interface IUploadingFile {
    file: File;
    progress: number;
    url?: string;
    id: string;
  }