import styled from "@emotion/styled";
import { Radio } from "@mui/material";
import { useEffect, useState } from "react";
import { AnswerState, susAnswerState } from "./store/answerState";
import { useRecoilState } from "recoil";

interface SUSQuestionProps {
  id: number;
  question: string;
}

const AnswerArea = styled.div`
  display: flex;
  padding: 20px 0px 0px 0px;

  div {
    margin: auto;
  }
`;

const SUSQuestion = (props: SUSQuestionProps) => {
  const [selectedValue, setSelectedValue] = useState(0);
  const [formAnswer, setFormAnswer] = useRecoilState(susAnswerState);

  useEffect(() => {
    const answer = formAnswer.filter((answer: AnswerState) => answer.id == props.id)
    if(answer.length == 0) {
      return;
    }
    setSelectedValue(answer[0].answer);
  }, []);

  const handleChange = (event: any) => {
    const answer = parseInt(event.target.value);
    setSelectedValue(answer);
    setFormAnswer((old: AnswerState[]) => {
      const answers = [...old];
      const old_id = answers.findIndex((answer) => answer.id == props.id);
      if (old_id != -1) {
        answers[old_id] = {
          id: props.id,
          answer: answer,
        };
      } else {
        answers.push({
          id: props.id,
          answer: answer,
        });
      }
      return answers;
    });
  };

  return (
    <div>
      <p>
        {props.id}. {props.question}
      </p>
      <AnswerArea>
        <div>全くそう思わない</div>
        <div>
          <Radio
            checked={selectedValue === 1}
            onChange={handleChange}
            value={1}
            name={"sus-" + props.id}
            inputProps={{ "aria-label": "A" }}
          />
          <Radio
            checked={selectedValue === 2}
            onChange={handleChange}
            value={2}
            name={"sus-" + props.id}
            inputProps={{ "aria-label": "B" }}
          />
          <Radio
            checked={selectedValue === 3}
            onChange={handleChange}
            value={3}
            name={"sus-" + props.id}
            inputProps={{ "aria-label": "C" }}
          />
          <Radio
            checked={selectedValue === 4}
            onChange={handleChange}
            value={4}
            name={"sus-" + props.id}
            inputProps={{ "aria-label": "D" }}
          />
          <Radio
            checked={selectedValue === 5}
            onChange={handleChange}
            value={5}
            name={"sus-" + props.id}
            inputProps={{ "aria-label": "E" }}
          />
        </div>
        <div>強くそう思う</div>
      </AnswerArea>
    </div>
  );
};
export default SUSQuestion;
