import { FsModes } from './lib/fs-modes.js';
import { FileSystemApi } from './lib/file-system-api.js';

const COLORS = {
  error: 'red',
};

const getElement = (id) => document.getElementById(id);
const clearOutput = () => (getElement('output').innerHTML = '');

const addOutputLine = (content, color) => {
  const li = document.createElement('li');
  li.style.color = color ? color : '';
  li.textContent = content;
  getElement('output').appendChild(li);
};

const withTryCatch = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    clearOutput();
    addOutputLine(`Error: ${error.message}`, COLORS.error);
  }
  return null;
};

const fsInit = async (mode) =>
  withTryCatch(async () => await FileSystemApi.init(mode));

const defaultMode = FsModes.native;
let fs = await fsInit(defaultMode);

const toggleFsMode = getElement('toggleFsMode');
const toggleFsModeTitle = getElement('toggleFsModeTitle');
toggleFsMode.value = defaultMode.value;
toggleFsModeTitle.textContent = defaultMode.title;
getElement('pickDir').disabled = true;

const toggleFsModeHandler = async () => {
  clearOutput();
  const toggleFsMode = getElement('toggleFsMode');
  const toggleFsModeTitle = getElement('toggleFsModeTitle');
  const mode = toggleFsMode.value;
  if (mode === FsModes.native.value) {
    toggleFsMode.value = FsModes.device.value;
    toggleFsModeTitle.textContent = FsModes.device.title;
    fs = await fsInit(FsModes.device);
    getElement('pickDir').disabled = false;
  } else {
    toggleFsMode.value = FsModes.native.value;
    toggleFsModeTitle.textContent = FsModes.native.title;
    fs = await fsInit(FsModes.native);
    getElement('pickDir').disabled = true;
  }
};

const pickDir = async () => {
  clearOutput();
  fs = await fsInit(FsModes.device);
};

const listFiles = async () => {
  clearOutput();
  await withTryCatch(async () => {
    const files = await fs.list();
    for (const file of files) {
      addOutputLine(`(${file.kind.at(0)}) ${file.name}`);
    }
  });
};

const createDir = async () => {
  const dirName = prompt('New dir name:');
  await withTryCatch(async () => {
    await fs.createDir(dirName);
    await listFiles();
  });
};

const createFile = async () => {
  const fileName = prompt('New file name:');
  await withTryCatch(async () => {
    await fs.create(fileName);
    await listFiles();
  });
};

const writeFile = async () => {
  const fileName = prompt('File name:');
  const content = prompt('Content:');
  await withTryCatch(async () => {
    await fs.write(fileName, content);
    await listFiles();
  });
};

const deleteFile = async () => {
  const fileName = prompt('File name to delete:');
  await withTryCatch(async () => {
    await fs.delete(fileName);
    await listFiles();
  });
};

const deleteDir = async () => {
  const dirName = prompt('Dir name to delete:');
  await withTryCatch(async () => {
    await fs.deleteDir(dirName);
    await listFiles();
  });
};

getElement('pickDir').addEventListener('click', pickDir);
getElement('createDir').addEventListener('click', createDir);
getElement('list').addEventListener('click', listFiles);
getElement('create').addEventListener('click', createFile);
getElement('write').addEventListener('click', writeFile);
getElement('delete').addEventListener('click', deleteFile);
getElement('deleteDir').addEventListener('click', deleteDir);
getElement('toggleFsMode').addEventListener('click', toggleFsModeHandler);
