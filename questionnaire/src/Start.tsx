import { useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  nasaTLXAnswerState,
  susAnswerState,
  userInfoAnswerState,
  productDescriptionAnswerState,
} from "./store/answerState";
import UserQuestion from "./UserQuestion";
import styled from "@emotion/styled";
import { sub_color } from "./color";
import { Button, Divider, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  min-height: 100vh;
  padding: 10vh 10vw;
  background-color: ${sub_color};
  margin: auto;
`;

const Start = () => {
  const navigate = useNavigate();
  const userinfo_answer = useRecoilValue(userInfoAnswerState);
  const setUserInfo = useSetRecoilState(userInfoAnswerState);
  const setNasaTLX = useSetRecoilState(nasaTLXAnswerState);
  const setSUS = useSetRecoilState(susAnswerState);
  const setProductDescription = useSetRecoilState(productDescriptionAnswerState);

  useEffect(() => {
    // Reset all states
    setUserInfo({
      user_id: "",
      join_date: "",
      join_time: "",
      condition: "",
    });
    setNasaTLX([]);
    setSUS([]);
    setProductDescription({
      satisfaction: null,
      guilt: null,
      ownership: null,
      honesty: null,
      agency: null,
    });
    
    // Clear localStorage
    localStorage.removeItem("page");
  }, []);

  const handleNext = () => {
    if (!userinfo_answer.user_id || !userinfo_answer.condition) {
      alert("全ての質問に回答してください。");
      return;
    }
    navigate("/");
  };

  return (
    <Container>
      <Paper
        elevation={3}
        style={{
          margin: "20px auto",
          padding: "10px",
          maxWidth: "800px",
        }}
      >
        実験参加者情報
      </Paper>
      <UserQuestion />
      <Divider />
      <div style={{ margin: "20px auto", maxWidth: "800px", display: "flex", justifyContent: "flex-end" }}>
        <Paper
          style={{ margin: "10px", padding: "10px", width: "50%" }}
          onClick={handleNext}
        >
          <Button>次へ {">>"}</Button>
        </Paper>
      </div>
    </Container>
  );
};

export default Start; 