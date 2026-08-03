import { spawn } from "node:child_process";

export class PythonScriptError extends Error {}

/**
 * Corre un script de Python pasándole `input` como JSON por stdin y parseando
 * stdout como JSON. Usado para invocar predictor/train.py y predictor/predict.py
 * sin levantar un servicio Python aparte.
 */
export function runPythonScript<T>(
  scriptPath: string,
  args: string[],
  input: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN ?? "python";
    const child = spawn(pythonBin, [scriptPath, ...args], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(new PythonScriptError(`No se pudo ejecutar Python (${pythonBin}): ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script ${scriptPath} salió con código ${code}:\n${stderr}`);
        reject(new PythonScriptError(`El script de predicción falló (código ${code})`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as T);
      } catch {
        console.error(`Salida no-JSON de ${scriptPath}:\n${stdout}`);
        reject(new PythonScriptError("El script de predicción devolvió una salida inválida"));
      }
    });

    child.stdin.write(Buffer.from(JSON.stringify(input), "utf-8"));
    child.stdin.end();
  });
}
