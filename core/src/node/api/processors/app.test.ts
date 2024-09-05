import { App } from './app';

it('should call stopServer', () => {
  const app = new App();
  const stopServerMock = jest.fn().mockResolvedValue('Server stopped');
  jest.mock('@janhq/server', () => ({
    stopServer: stopServerMock
  }));
  const result = app.stopServer();
  expect(stopServerMock).toHaveBeenCalled();
});

it('should correctly retrieve basename', () => {
  const app = new App();
  const result = app.baseName('/path/to/file.txt');
  expect(result).toBe('file.txt');
});

it('should correctly identify subdirectories', () => {
  const app = new App();
  const basePath = process.platform === 'win32' ? 'C:\\path\\to' : '/path/to';
  const subPath = process.platform === 'win32' ? 'C:\\path\\to\\subdir' : '/path/to/subdir';
  const result = app.isSubdirectory(basePath, subPath);
  expect(result).toBe(true);
});

it('should correctly join multiple paths', () => {
  const app = new App();
  const result = app.joinPath(['path', 'to', 'file']);
  const expectedPath = process.platform === 'win32' ? 'path\\to\\file' : 'path/to/file';
  expect(result).toBe(expectedPath);
});

it('should call correct function with provided arguments using process method', () => {
  const app = new App();
  const mockFunc = jest.fn();
  app.joinPath = mockFunc;
  app.process('joinPath', ['path1', 'path2']);
  expect(mockFunc).toHaveBeenCalledWith(['path1', 'path2']);
});
