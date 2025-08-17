import styled from "@emotion/styled";
import { FC, createRef, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { AnswerState, nasaTLXAnswerState } from "./store/answerState";

const QuestionContainer = styled.section`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}`;

const QuestionTitle = styled.h1`
  font-size: 1.5rem;
  margin-top: 0;
  width: 30%;
`;

const QuestionDescription = styled.div`
  width: 70%;
  padding-left: 5%;
`;

const QuestionAnswer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 40px 0 0 0;
  width: 100%;
`;

const Svg = styled.svg`
  &:hover {
    color: white;
  }
`;

export interface QuestionProps {
  id: number;
  name: string;
  description: string;
  min: string;
  max: string;
}

const NasaTLXQuestion: FC<QuestionProps> = (props) => {
  const svg_info = {
    width: 600,
    height: 40,
  };

  // const [lineRef, setLineRef] = useState<SVGLineElement | null>(null);
  const lineRef = createRef<SVGLineElement>();
  const [isLineExist, setIsLineExist] = useState(() => props.id == -1);
  const [formAnswer, setFormAnswer] = useRecoilState(nasaTLXAnswerState);

  useEffect(() => {
    if (svgref.current == null) {
      return;
    }
    const answer = formAnswer.filter(
      (answer: AnswerState) => answer.id == props.id
    );
    if (answer.length == 0) {
      return;
    }

    setIsLineExist(true);

    const x = (0.01 + 0.98 * (answer[0].answer / 100)) * svg_info.width;

    if (lineRef.current == null) {
      return;
    }

    const line = lineRef.current;
    line.setAttribute("x1", `${x}`);
    line.setAttribute("x2", `${x}`);
    line.setAttribute("y1", "0");
    line.setAttribute("y2", "100");
    line.setAttribute("stroke", "red");
    line.setAttribute("stroke-width", "2.5");
    line.setAttribute("fill", "#00000000");
    svgref.current.appendChild(line);
    setIsLineExist(true);
  }, [isLineExist]);

  const onclick = (event: any) => {
    if (svgref.current == null) {
      return;
    }
    if (lineRef != null) {
      const clientX = event.clientX;
      const rect = svgref.current.getBoundingClientRect();
      let x = clientX - rect.left;

      if (x / svg_info.width < 0.01) {
        x = 0.01 * svg_info.width;
      } else if (x / svg_info.width > 0.99) {
        x = 0.99 * svg_info.width;
      }
      const line = lineRef.current;
      line?.setAttribute("x1", `${x}`);
      line?.setAttribute("x2", `${x}`);
      setIsLineExist(true);

      // 更新処理
      updateAnswer(x);
      return;
    }

    const clientX = event.clientX;
    const clientY = event.clientY;
    const rect = svgref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    console.info(x, y);
    if (x / svg_info.width < 0.005 || x / svg_info.width > 0.995) {
      return;
    }

    // 更新処理
    updateAnswer(x);
  };

  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const ondrag = (event: any) => {
    if (!isKeyPressed) {
      return;
    }

    const svg = svgref.current;
    if (lineRef == null || svg == null) {
      return;
    }

    const clientX = event.clientX;
    const rect = svg.getBoundingClientRect();
    let x = clientX - rect.left;

    if (x / svg_info.width < 0.01) {
      x = 0.01 * svg_info.width;
    } else if (x / svg_info.width > 0.99) {
      x = 0.99 * svg_info.width;
    }
    const line = lineRef.current;
    line?.setAttribute("x1", `${x}`);
    line?.setAttribute("x2", `${x}`);

    // 更新処理
    updateAnswer(x);
  };

  const updateAnswer = (x: number) => {
    if(props.id == -1){
      return;
    }
    const answer = Math.round(((x / svg_info.width - 0.01) / 0.98) * 100);
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

  const svgref = createRef<SVGSVGElement>();

  const LineList = [];
  for (let i = 1; i < 20; i++) {
    const x = 1 + (98 / 20) * i;
    LineList.push(
      <line
        key={i}
        x1={`${x}%`}
        y1={i == 10 ? "0%" : "50%"}
        x2={`${x}%`}
        y2="100%"
        stroke="black"
        strokeWidth="2.5"
      />
    );
  }

  return (
    <QuestionContainer>
      <QuestionTitle>{props.name}</QuestionTitle>
      <QuestionDescription>{props.description}</QuestionDescription>
      <QuestionAnswer>
        <div>
          <Svg
            ref={svgref}
            width={svg_info.width}
            height={svg_info.height}
            onClick={onclick}
            onMouseMove={ondrag}
            onMouseDown={() => setIsKeyPressed(true)}
            onMouseUp={() => setIsKeyPressed(false)}
          >
            <line
              x1="1%"
              y1="100%"
              x2="99%"
              y2="100%"
              stroke="black"
              strokeWidth="5"
            />
            {LineList}
            <line
              x1="1%"
              y1="50%"
              x2="1%"
              y2="100%"
              stroke="black"
              strokeWidth="2.5"
            />
            <line
              x1="99%"
              y1="50%"
              x2="99%"
              y2="100%"
              stroke="black"
              strokeWidth="2.5"
            />
            {/* 赤い線 */}
            {isLineExist && (
              <line
                ref={lineRef}
                x1="52%"
                y1="0%"
                x2="52%"
                y2="100%"
                stroke="red"
                strokeWidth="2.5"
              />
            )}
          </Svg>
          <div style={{ display: "table", width: svg_info.width }}>
            <div
              style={{ display: "table-cell", width: "50%", textAlign: "left" }}
            >
              {props.min}
            </div>
            <div
              style={{
                display: "table-cell",
                width: "50%",
                textAlign: "right",
              }}
            >
              {props.max}
            </div>
          </div>
        </div>
      </QuestionAnswer>
    </QuestionContainer>
  );
};

export default NasaTLXQuestion;
