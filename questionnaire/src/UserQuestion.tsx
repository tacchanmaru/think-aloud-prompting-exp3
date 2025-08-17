import { Paper, TextField, FormControl, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useRecoilState } from "recoil";
import { userInfoAnswerState } from "./store/answerState";
import { useEffect, useState } from "react";

interface LocalAnswer {
  user_id: string;
  condition: string;
}

const UserQuestion = () => {
  const [localAnswer, setLocalAnswer] = useState({} as LocalAnswer);
  const [formAnswer, setFormAnswer] = useRecoilState(userInfoAnswerState);
  useEffect(() => {
    if (Object.keys(formAnswer).length == 0) return;
    const localAnswer = {} as LocalAnswer;
    if (formAnswer.user_id) localAnswer.user_id = formAnswer.user_id;
    if (formAnswer.condition) localAnswer.condition = formAnswer.condition;
    setLocalAnswer({ ...localAnswer });
  }, []);

  const setUserId = (event: any) => {
    const user_id = event.target.value;
    
    // 空の値は許可する（入力中のため）
    if (user_id === "") {
      setLocalAnswer((old) => {
        return {
          ...old,
          user_id: "",
        };
      });
      setFormAnswer((old: any) => {
        return {
          ...old,
          user_id: user_id,
        };
      });
      return;
    }
    
    // 数値に変換して1-100の範囲かチェック
    const num = parseInt(user_id);
    if (isNaN(num) || num < 1 || num > 100) {
      return;
    }
    
    // ユーザーIDに基づいて条件を自動選択（12パターン）
    const conditions = [
      "TP_TAP_1_2_3",  // 0
      "TP_TAP_2_3_1",  // 1
      "TP_TAP_3_1_2",  // 2
      "TAP_TP_1_2_3",  // 3
      "TAP_TP_2_3_1",  // 4
      "TAP_TP_3_1_2",  // 5
      "TP_TAP_1_3_2",  // 6
      "TP_TAP_2_1_3",  // 7
      "TP_TAP_3_2_1",  // 8
      "TAP_TP_1_3_2",  // 9
      "TAP_TP_2_1_3",  // 10
      "TAP_TP_3_2_1"   // 11
    ];
    const selectedCondition = conditions[num % 12];

    setLocalAnswer((old) => {
      return {
        ...old,
        user_id: user_id,
        condition: selectedCondition,
      };
    });
    setFormAnswer((old: any) => {
      return {
        ...old,
        user_id: user_id,
        condition: selectedCondition,
      };
    });
  };

  const setCondition = (event: React.ChangeEvent<HTMLInputElement>) => {
    const condition = event.target.value;
    setLocalAnswer((old) => {
      return {
        ...old,
        condition: condition,
      };
    });
    setFormAnswer((old: any) => {
      return {
        ...old,
        condition: condition,
      };
    });
  };

  return (
    <>
      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <div>ユーザーIDを記入してください</div>
        <div>
          <TextField
            onChange={setUserId}
            value={localAnswer.user_id || ""}
            margin="dense"
            fullWidth
            type="number"
            inputProps={{ 
              min: 1, 
              max: 100,
              autoComplete: "off"
            }}
            error={localAnswer.user_id !== "" && localAnswer.user_id !== undefined && (parseInt(localAnswer.user_id) < 1 || parseInt(localAnswer.user_id) > 100)}
            helperText={localAnswer.user_id !== "" && localAnswer.user_id !== undefined && (parseInt(localAnswer.user_id) < 1 || parseInt(localAnswer.user_id) > 100) ? "1から100の範囲で入力してください" : ""}
          />
        </div>
      </Paper>
      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <div>実験条件(タスク１)</div>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="condition"
            name="condition"
            value={localAnswer.condition || ""}
            onChange={setCondition}
          >
            <FormControlLabel value="TP_TAP_1_2_3" control={<Radio />} label="TP_TAP_1_2_3" />
            <FormControlLabel value="TP_TAP_2_3_1" control={<Radio />} label="TP_TAP_2_3_1" />
            <FormControlLabel value="TP_TAP_3_1_2" control={<Radio />} label="TP_TAP_3_1_2" />
            <FormControlLabel value="TAP_TP_1_2_3" control={<Radio />} label="TAP_TP_1_2_3" />
            <FormControlLabel value="TAP_TP_2_3_1" control={<Radio />} label="TAP_TP_2_3_1" />
            <FormControlLabel value="TAP_TP_3_1_2" control={<Radio />} label="TAP_TP_3_1_2" />
            <FormControlLabel value="TP_TAP_1_3_2" control={<Radio />} label="TP_TAP_1_3_2" />
            <FormControlLabel value="TP_TAP_2_1_3" control={<Radio />} label="TP_TAP_2_1_3" />
            <FormControlLabel value="TP_TAP_3_2_1" control={<Radio />} label="TP_TAP_3_2_1" />
            <FormControlLabel value="TAP_TP_1_3_2" control={<Radio />} label="TAP_TP_1_3_2" />
            <FormControlLabel value="TAP_TP_2_1_3" control={<Radio />} label="TAP_TP_2_1_3" />
            <FormControlLabel value="TAP_TP_3_2_1" control={<Radio />} label="TAP_TP_3_2_1" />
          </RadioGroup>
        </FormControl>
      </Paper>
    </>
  );
};

export default UserQuestion;
