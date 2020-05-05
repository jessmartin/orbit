import { Command, flags } from "@oclif/command";
import firebase from "firebase/app";
import "firebase/firestore";
import fs from "fs";

import {
  MetabookFirebaseDataClient,
  MetabookFirebaseUserClient,
} from "metabook-client";
import {
  Attachment,
  AttachmentIDReference,
  AttachmentMimeType,
  getActionLogFromPromptActionLog,
  getIDForAttachment,
  getIDForPrompt,
  getIDForPromptTask,
  imageAttachmentType,
  Prompt,
  PromptActionLog,
  PromptParameters,
  PromptTask,
  PromptTaskID,
  PromptTaskParameters,
} from "metabook-core";
import {
  testApplicationPrompt,
  testBasicPrompt,
  testClozePrompt,
} from "metabook-sample-data";
import path from "path";

function getTasksFromPrompts(prompts: Prompt[]): PromptTaskID[] {
  const taskLists: PromptTaskID[][] = prompts.map((spec) => {
    let promptParameters: PromptParameters;
    switch (spec.promptType) {
      case "basic":
      case "applicationPrompt":
        promptParameters = null;
        break;
      case "cloze":
        // TODO: import all cloze indices
        promptParameters = { clozeIndex: 0 };
        break;
    }
    return [
      getIDForPromptTask({
        promptID: getIDForPrompt(spec),
        promptType: spec.promptType,
        promptParameters: promptParameters,
      } as PromptTask),
    ];
  });

  return taskLists.reduce((output, list) => output.concat(list), []);
}

class Ingest extends Command {
  static flags = {
    help: flags.help(),
    userID: flags.string({
      required: true,
    }),
  };

  async run() {
    const { flags } = this.parse(Ingest);

    const app = firebase.initializeApp({
      apiKey: "AIzaSyAwlVFBlx4D3s3eSrwOvUyqOKr_DXFmj0c",
      authDomain: "metabook-system.firebaseapp.com",
      databaseURL: "https://metabook-system.firebaseio.com",
      projectId: "metabook-system",
      storageBucket: "metabook-system.appspot.com",
      messagingSenderId: "748053153064",
      appId: "1:748053153064:web:efc2dfbc9ac11d8512bc1d",
    });
    const dataClient = new MetabookFirebaseDataClient(
      app,
      app.functions(),
      () => {
        throw new Error("unimplemented");
      },
    );

    const imageData = await fs.promises.readFile(
      path.resolve(__dirname, "__fixtures__/general_circuit.png"),
    );
    const imageAttachment: Attachment = {
      type: imageAttachmentType,
      mimeType: AttachmentMimeType.PNG,
      contents: imageData.toString("binary"),
    };
    const imageAttachmentIDReference: AttachmentIDReference = {
      type: imageAttachmentType,
      id: getIDForAttachment(imageData),
      byteLength: imageData.byteLength,
    };

    const testImagePrompt: Prompt = {
      ...testBasicPrompt,
      question: {
        ...testBasicPrompt.question,
        attachments: [imageAttachmentIDReference],
      },
    };

    const specs = [
      testImagePrompt,
      testBasicPrompt,
      testApplicationPrompt,
      testClozePrompt,
    ];

    await dataClient.recordPrompts(specs);
    console.log(`Recorded ${specs.length} spec(s)`);

    await dataClient.recordAttachments([imageAttachment]);
    console.log(`Recorded 1 attachment`);

    const userClient = new MetabookFirebaseUserClient(app, flags.userID);
    const tasks = getTasksFromPrompts(specs);
    const now = Date.now();
    const actionLogs: PromptActionLog<PromptTaskParameters>[] = tasks.map(
      (taskID) => ({
        actionLogType: "ingest",
        timestampMillis: now,
        taskID,
        provenance: null,
      }),
    );
    await userClient.recordActionLogs(
      actionLogs.map(getActionLogFromPromptActionLog),
    );
    console.log(
      `Recorded ${actionLogs.length} logs for userID ${flags.userID}`,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
(Ingest.run() as Promise<unknown>).catch(require("@oclif/errors/handle"));