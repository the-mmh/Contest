const { ShareServiceClient, StorageSharedKeyCredential } = require("@azure/storage-file-share");

require('dotenv').config();

const account = process.env.AZURE_ACCOUNT;
const accountKey = process.env.AZURE_ACCOUNT_KEY;
const credential = new StorageSharedKeyCredential(account, accountKey);
const serviceClient = new ShareServiceClient(`https://${account}.file.core.windows.net`, credential);


async function streamToBuffer(readableStream) {
    return new Promise(async(resolve, reject) => {
        const chunks = [];
        await readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        await readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        await readableStream.on("error", reject);
    });
}


async function azurefilesread(shareName, fileName) {
    const fileClient = serviceClient
        .getShareClient(shareName)
        .rootDirectoryClient.getFileClient(fileName);

    const downloadFileResponse = await fileClient.download();
    const txt = `${(
    await streamToBuffer(downloadFileResponse.readableStreamBody)
  ).toString().trim()}`;
    console.log(txt);
    console.log("type -- ", typeof txt);
    return txt;
}


async function azurefilescreate(shareName, fileName, content) {
    const directoryClient = serviceClient.getShareClient(shareName).getDirectoryClient('');

    const fileClient = directoryClient.getFileClient(fileName);
    await fileClient.create(content.length);
    console.log(`Create file ${fileName} successfully`);

    await fileClient.uploadRange(content, 0, content.length);
    console.log(`Upload file range "${content}" to ${fileName} successfully`);
}


async function azuresubmissionread(shareName, fileName, path) {
    const fileClient = serviceClient
        .getShareClient(shareName)
        .rootDirectoryClient.getFileClient(fileName);

    const file = await fileClient.downloadToFile(path);

}


module.exports.azurefilesread = azurefilesread;
module.exports.azurefilescreate = azurefilescreate;
module.exports.azuresubmissionread = azuresubmissionread;