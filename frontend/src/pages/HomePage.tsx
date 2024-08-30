import { useState } from "react";
import { Layout, Button, Typography, Divider } from "antd";
const { Header, Content, Footer } = Layout;

import { TopicInput, LlmInput } from "../components/UserInputs";
import { useNavigate } from "react-router-dom";

export default function HomePage({ ws }: { ws: WebSocket }) {
  const navigate = useNavigate();

  const [llm1, setLlm1] = useState("gpt");
  const [llm2, setLlm2] = useState("claude");
  const [llm1Stance, setLlm1Stance] = useState("Pro");
  const [llm2Stance, setLlm2Stance] = useState("Con");
  const [llm1Personality, setLlm1Personality] = useState("Snarky");
  const [llm2Personality, setLlm2Personality] = useState("Humorous");
  const [topic, setTopic] = useState("Should pineapple on pizza be allowed?");

  const llm1SetFunctions = {
    changeModel: setLlm1,
    changeStance: setLlm1Stance,
    changePersonality: setLlm1Personality,
    index: 1,
  };

  const llm2SetFunctions = {
    changeModel: setLlm2,
    changeStance: setLlm2Stance,
    changePersonality: setLlm2Personality,
    index: 2,
  };

  const buttonClick = () => {
    console.log("Displaying values:");
    console.log(
      topic,
      llm1,
      llm2,
      llm1Stance,
      llm2Stance,
      llm1Personality,
      llm2Personality
    );
    const wsMessage = {
      type: "setup",
      content: {
        topic,
        llm1,
        llm2,
        llm1Stance,
        llm2Stance,
        llm1Personality,
        llm2Personality,
      },
    };
    ws.send(JSON.stringify(wsMessage));
    navigate("/debate");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "linear-gradient(45deg, #414535, #8D9575)",
          height: "auto",
        }}
      >
        <Typography.Title level={1} style={{ color: "white", margin: "20px" }}>
          Debate AI
        </Typography.Title>
      </Header>
      <Content
        style={{
          margin: "24px 16px 0",
          overflow: "initial",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TopicInput onChange={setTopic} />
        <Divider
          style={{ minWidth: "20%", width: "50%", color: "#414535" }}
          variant="solid"
        />
        <LlmInput {...llm1SetFunctions} />
        <Divider
          style={{ minWidth: "20%", width: "50%", color: "#414535" }}
          variant="solid"
        />
        <LlmInput {...llm2SetFunctions} />
        <Button
          type="primary"
          size="large"
          style={{
            marginTop: "20px",
            background: "#8D9575",
          }}
          onClick={buttonClick}
        >
          Next
        </Button>
      </Content>
      <Footer>
        <Typography.Text>Powered by OpenAI and Anthropic</Typography.Text>
      </Footer>
    </Layout>
  );
}
