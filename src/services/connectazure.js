const { ShareServiceClient, StorageSharedKeyCredential } = require("@azure/storage-file-share");

require('dotenv').config();

const account = "contestiiitp";
const accountKey = "Lxj7+F1JeursnOcs/223ujVDzn9aQ3e3B6tYXmEwEq1aQbdG1ATtoWijQdp1gVvJHBQ0PiB/RTiRB42e4shKKw==";
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
  ).toString()}`;
    console.log(txt);
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

async function createdirectoryfile(sharename, directoryname, filename, content) {
    const directoryClient = serviceClient.getShareClient(sharename).getDirectoryClient(directoryname);

    const fileClient = directoryClient.getFileClient(filename);
    await fileClient.create(content.length);
    console.log(`Create file ${filename} successfully`);

    await fileClient.uploadRange(content, 0, content.length);
    console.log(`Upload file range "${content}" to ${filename} successfully`);
}
async function createdirectory(sharename, directoryname) {
    const directoryClient = serviceClient.getShareClient(sharename).getDirectoryClient(directoryname);
    await directoryClient.create();

    console.log(`Directory ${directoryname} created`);
}

module.exports.azurefilesread = azurefilesread;
module.exports.azurefilescreate = azurefilescreate;
module.exports.createdirectoryfile = createdirectoryfile;
module.exports.createdirectory = createdirectory;
module.exports.azuresubmissionread = azuresubmissionread;