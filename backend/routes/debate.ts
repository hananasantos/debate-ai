import { WSRoute } from "../types/ws.types";
import Debate from "../controllers/debate";
import Debater from "../agents/debater";
let debater1: Debater;
let debater2: Debater;
let debate: Debate;

const setup: WSRoute = async (ws, message) => {
  const debateSetup = message.content;
  console.log("Received setup: ", debateSetup);

  const topic = debateSetup.topic;

  const debater1Setup = {
    llmType: debateSetup.llm1,
    stance: debateSetup.llm1Stance,
    personality: debateSetup.llm1Personality,
  };
  const debater2Setup = {
    llmType: debateSetup.llm2,
    stance: debateSetup.llm2Stance,
    personality: debateSetup.llm2Personality,
  };

  try {
    debater1 = new Debater(
      debater1Setup.stance,
      debater1Setup.personality,
      topic,
      1,
      debater1Setup.llmType,
      ws
    );
    debater2 = new Debater(
      debater2Setup.stance,
      debater2Setup.personality,
      topic,
      2,
      debater2Setup.llmType,
      ws
    );

    const debater1Send = {
      model: debater1Setup.llmType,
      stance: debater1Setup.stance,
      personality: debater2Setup.personality,
    };
    const debater2Send = {
      model: debater2Setup.llmType,
      stance: debater2Setup.stance,
      personality: debater2Setup.personality,
    };

    ws.send(
      JSON.stringify({
        type: "setup",
        content: {
          status: 1,
          message: "successful setup!",
          llm1: debater1Send,
          llm2: debater2Send,
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
  debate = new Debate({ topic, debater1, debater2 }, ws);
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
