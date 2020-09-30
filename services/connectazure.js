const { ShareServiceClient, StorageSharedKeyCredential } = require("@azure/storage-file-share");
//require('dotenv').config();
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const account = "contestiiitp";
const accountKey = "Lxj7+F1JeursnOcs/223ujVDzn9aQ3e3B6tYXmEwEq1aQbdG1ATtoWijQdp1gVvJHBQ0PiB/RTiRB42e4shKKw==";
const credential = new StorageSharedKeyCredential(account, accountKey);
const serviceClient = new ShareServiceClient(`https://${account}.file.core.windows.net`, credential);

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

async function azurefilesread(shareName, fileName) {
  const fileClient = serviceClient
    .getShareClient(shareName)
    .rootDirectoryClient.getFileClient(fileName);

  const downloadFileResponse = await fileClient.download();
  const txt = `${(
    await streamToBuffer(downloadFileResponse.readableStreamBody)
  ).toString()}`;
  console.log(txt);
  return txt;
}

async function azurefilescreate(shareName, fileName, content ) {
  const directoryClient = serviceClient.getShareClient(shareName).getDirectoryClient('');

  //const content = "Hello World!";
  //const fileName = "newfile" + new Date().getTime();
  const fileClient = directoryClient.getFileClient(fileName);
  await fileClient.create(content.length);
  console.log(`Create file ${fileName} successfully`);

  // Upload file range
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

