import { FsModes } from './fs-modes.js';

const deviceFsRoot = async () => {
  try {
    return await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (e) {
    let error;
    if (e.name === 'AbortError') {
      error = new Error('Directory selection was aborted');
    } else if (e.name === 'NotAllowedError') {
      error = new Error('Permission to access device file system was denied');
    } else if (e.name === 'TypeError') {
      error = new Error('Device file system is not supported in this browser');
    } else {
      error = new Error(`Failed to access device file system`);
    }
    error.cause = e;
    throw error;
  }
};

const opFsRoot = async () => {
  try {
    return await navigator.storage.getDirectory();
  } catch (e) {
    let error;
    if (e.name === 'NotFoundError') {
      error = new Error('Origin private file system is not available');
    } else {
      error = new Error('Failed to access origin private file system');
    }
    error.cause = e;
    throw error;
  }
};

export const fsRoot = async (mode) => {
  if (mode === FsModes.device) {
    return deviceFsRoot();
  } else if (mode === FsModes.native) {
    return opFsRoot();
  } else {
    throw new Error('Unsupported file system mode');
  }
};
