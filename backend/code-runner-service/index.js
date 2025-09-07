import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));

// Utility: write code to a temp file
function writeTempFile(prefix, ext, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'collabify-'));
  const file = path.join(dir, `${prefix}${ext}`);
  fs.writeFileSync(file, content, 'utf8');
  return { dir, file };
}

// Execute a command with optional stdin, timeout and collect stdout/stderr
function runCommand(command, args, options = {}, timeoutMs = 8000, input = '') {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';

    const killTimer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      stderr += `\n[Process killed after ${timeoutMs}ms timeout]`;
      resolve({ code: -1, stdout, stderr });
    }, timeoutMs);

    if (input && child.stdin) {
      try {
        child.stdin.write(input);
      } catch {}
    }
    try { child.stdin.end(); } catch {}

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('close', (code) => {
      clearTimeout(killTimer);
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      resolve({ code: -1, stdout, stderr: String(err) });
    });
  });
}

// Map language to run sequence
async function executeCode({ language, code, stdin }) {
  const input = (stdin || '').toString();
  switch ((language || '').toLowerCase()) {
    case 'javascript': {
      const { file } = writeTempFile('main', '.js', code);
      const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';
      return await runCommand(nodeCmd, [file], {}, 8000, input);
    }
    case 'typescript': {
      return { code: -1, stdout: '', stderr: 'TypeScript runtime not configured on server.' };
    }
    case 'python': {
      const { file } = writeTempFile('main', '.py', code);
      const cmd = process.platform === 'win32' ? 'python' : 'python3';
      return await runCommand(cmd, [file], {}, 8000, input);
    }
    case 'java': {
      const { dir, file } = writeTempFile('Main', '.java', code);
      const javac = await runCommand('javac', [file], { cwd: dir }, 8000);
      if (javac.code !== 0) return javac;
      return await runCommand('java', ['Main'], { cwd: dir }, 8000, input);
    }
    case 'c': {
      const { dir, file } = writeTempFile('main', '.c', code);
      const outExe = path.join(dir, process.platform === 'win32' ? 'a.exe' : 'a.out');
      const gcc = await runCommand('gcc', [file, '-o', outExe], { cwd: dir }, 8000);
      if (gcc.code !== 0) return gcc;
      return await runCommand(outExe, [], { cwd: dir }, 8000, input);
    }
    case 'cpp': {
      const { dir, file } = writeTempFile('main', '.cpp', code);
      const outExe = path.join(dir, process.platform === 'win32' ? 'a.exe' : 'a.out');
      const gpp = await runCommand('g++', [file, '-o', outExe], { cwd: dir }, 8000);
      if (gpp.code !== 0) return gpp;
      return await runCommand(outExe, [], { cwd: dir }, 8000, input);
    }
    case 'csharp': {
      const { dir } = writeTempFile('Program', '.cs', code);
      const init = await runCommand('dotnet', ['new', 'console', '--force'], { cwd: dir }, 8000);
      if (init.code !== 0) return init;
      fs.writeFileSync(path.join(dir, 'Program.cs'), code, 'utf8');
      const build = await runCommand('dotnet', ['build', '-c', 'Release'], { cwd: dir }, 20000);
      if (build.code !== 0) return build;
      return { code: 0, stdout: 'Built successfully. Running is not fully wired in this minimal demo.', stderr: '' };
    }
    case 'go': {
      const { dir, file } = writeTempFile('main', '.go', code);
      return await runCommand('go', ['run', file], { cwd: dir }, 8000, input);
    }
    case 'php': {
      const { file } = writeTempFile('main', '.php', code);
      return await runCommand('php', [file], {}, 8000, input);
    }
    case 'ruby': {
      const { file } = writeTempFile('main', '.rb', code);
      return await runCommand('ruby', [file], {}, 8000, input);
    }
    case 'rust': {
      const { dir, file } = writeTempFile('main', '.rs', code);
      const outExe = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
      const rustc = await runCommand('rustc', [file, '-o', outExe], { cwd: dir }, 8000);
      if (rustc.code !== 0) return rustc;
      return await runCommand(outExe, [], { cwd: dir }, 8000, input);
    }
    case 'shell': {
      if (process.platform === 'win32') {
        return { code: -1, stdout: '', stderr: 'Shell execution is not supported on Windows server.' };
      }
      const { file } = writeTempFile('script', '.sh', code);
      fs.chmodSync(file, 0o755);
      return await runCommand(file, [], {}, 8000, input);
    }
    default:
      return { code: -1, stdout: '', stderr: `Language not supported: ${language}` };
  }
}

app.post('/api/run', async (req, res) => {
  try {
    const { language, code, stdin } = req.body || {};
    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' });
    }
    const result = await executeCode({ language, code, stdin });
    res.json({ ...result });
  } catch (e) {
    res.status(500).json({ error: 'Execution error', details: String(e) });
  }
});

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`Code Runner Service running on port ${PORT}`));