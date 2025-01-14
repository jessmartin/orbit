import * as firebaseTesting from "@firebase/rules-unit-testing";
import childProcess, { ChildProcess } from "child_process";
import events from "events";
import firebase from "firebase";
import path from "path";

const projectID = "metabook-system";

let emulatorProcess: ChildProcess | null = null;

export function startFirebaseTestingEmulator() {
  if (emulatorProcess) {
    throw new Error("Emulator process already started");
  }

  console.log(`Starting emulator in ${path.resolve(__dirname, "..")}`);
  const localEmulatorProcess = childProcess.spawn(
    "npx",
    ["firebase", "emulators:start"],
    {
      cwd: path.resolve(__dirname, ".."),
    },
  );
  emulatorProcess = localEmulatorProcess;

  return new Promise((resolve) => {
    localEmulatorProcess.stdout.on("data", (data) => {
      console.log(data.toString());
      if (/All emulators ready/.test(data.toString())) {
        resolve(undefined);
      }
    });

    localEmulatorProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
      // fail("Couldn't start Firebase emulator");
      // reject();
    });
  });
}

export async function stopFirebaseTestingEmulator() {
  if (emulatorProcess) {
    emulatorProcess?.kill("SIGINT");
    const code = await events.once(emulatorProcess, "close");
    console.log(`firebase process exited: ${code}`);
    emulatorProcess = null;
  }
}

let sharedFunctionsInstance: firebase.functions.Functions | null = null;
export function createTestFirebaseApp(
  uid = "testUserID",
  email = "test@test.com",
): {
  firestore: firebase.firestore.Firestore;
  functions: firebase.functions.Functions;
} {
  process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
  const testApp = firebaseTesting.initializeTestApp({
    projectId: projectID,
    auth: { uid, email },
  });

  if (!sharedFunctionsInstance) {
    const app = firebase.initializeApp({ projectId: projectID });
    sharedFunctionsInstance = app.functions();
    sharedFunctionsInstance.useEmulator("localhost", 5001);
  }
  return {
    firestore: testApp.firestore() as firebase.firestore.Firestore,
    functions: sharedFunctionsInstance,
  };
}

export function createTestAdminFirebaseApp(): {
  firestore: firebase.firestore.Firestore;
} {
  const testApp = firebaseTesting.initializeAdminApp({
    projectId: projectID,
  });
  return { firestore: testApp.firestore() as firebase.firestore.Firestore };
}

export async function resetTestFirestore(
  firestore: firebase.firestore.Firestore,
) {
  await firestore.terminate();
  await firestore.clearPersistence();
  await firebaseTesting.clearFirestoreData({ projectId: projectID });
}
