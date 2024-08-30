import { WSRoute } from "../types/ws.types";
import Debate from "../controllers/debate";
import GPT from "../services/gpt";
import Claude from "../services/claude";

let llm1: GPT | Claude;
let llm2: GPT | Claude;
let debate: Debate;

const setup: WSRoute = async (ws, message) => {
  const debateSetup = message.content;
  console.log("Received setup: ", debateSetup);

  const topic = debateSetup.topic;

  const llm1Setup = {
    llm: debateSetup.llm1,
    stance: debateSetup.llm1Stance,
    personality: debateSetup.llm1Personality,
  };
  const llm2Setup = {
    llm: debateSetup.llm2,
    stance: debateSetup.llm2Stance,
    personality: debateSetup.llm2Personality,
  };

  try {
    llm1 =
      llm1Setup.llm === "gpt"
        ? new GPT(llm1Setup.stance, llm1Setup.personality, topic, ws, 1)
        : new Claude(llm1Setup.stance, llm1Setup.personality, topic, ws, 1);
    llm2 =
      llm2Setup.llm === "gpt"
        ? new GPT(llm2Setup.stance, llm2Setup.personality, topic, ws, 2)
        : new Claude(llm2Setup.stance, llm2Setup.personality, topic, ws, 2);

    const llm1Send = {
      model: llm1Setup.llm,
      stance: llm1Setup.stance,
      personality: llm1Setup.personality,
    };
    const llm2Send = {
      model: llm2Setup.llm,
      stance: llm2Setup.stance,
      personality: llm2Setup.personality,
    };

    ws.send(
      JSON.stringify({
        type: "setup",
        content: {
          status: 1,
          message: "successful setup!",
          llm1: llm1Send,
          llm2: llm2Send,
          topic: topic,
        },
      })
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "setup",
        content: { status: 0, message: "failed setup!" },
      })
    );
  }
};

const start: WSRoute = async (ws, message) => {
  const topic = message.content.topic;
  console.log("Starting debate with topic: ", topic);
  debate = new Debate({ topic, llm1, llm2 }, ws);
  await debate.start();
};

const next: WSRoute = async (ws, message) => {
  await debate.switchDebater();
};

export default {
  setup,
  start,
  next,
};
