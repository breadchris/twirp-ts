export class File {
    constructor(fileName) {
        this.fileName = fileName;
        this.content = "";
    }
    getFilename() {
        return this.fileName;
    }
    setContent(content) {
        this.content = content;
        return this;
    }
    getContent() {
        return this.content;
    }
}
