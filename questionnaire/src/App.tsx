import { FC, ReactNode, useEffect, useRef, useState } from "react";
import {
  nasaTLXAnswerState,
  susAnswerState,
  userInfoAnswerState,
  productDescriptionAnswerState,
} from "./store/answerState";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Button, Divider, Paper, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { sub_color } from "./color";
import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import SUSQuestion from "./SUSQuestion";
import NasaTLXQuestion from "./NasaTLXQuestion";
import ProductDescriptionQuestion from "./ProductDescriptionQuestion";
import { nasa_tlx_list, sus_list } from "./constraints";
import AdminConfirmation from "./AdminConfirmation";

const Container = styled.div`
  min-height: 100vh;
  padding: 10vh 10vw;
  background-color: ${sub_color};
  margin: auto;
`;


function App() {
  const navigate = useNavigate();

  const userinfo_answer = useRecoilValue(userInfoAnswerState);
  const nasa_tlx_result = useRecoilValue(nasaTLXAnswerState);
  const sus_result = useRecoilValue(susAnswerState);
  const product_description_answer = useRecoilValue(productDescriptionAnswerState);
  
  const setNasaTLX = useSetRecoilState(nasaTLXAnswerState);
  const setSUS = useSetRecoilState(susAnswerState);
  const setProductDescription = useSetRecoilState(productDescriptionAnswerState);

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [taskDataStore, setTaskDataStore] = useState<any[]>([]);
  const topref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page_log = localStorage.getItem("page");
    if (page_log) setPage(parseInt(page_log));
    setLoading(true);
  }, []);

  useEffect(() => {
    if (loading) localStorage.setItem("page", page.toString());
  }, [page, loading]);

  const toBeforePage = () => {
    if (page > 0) setPage((page) => page - 1);
    topref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toAfterPage = async () => {
    const taskPage = currentTaskPage;
    const taskNum = currentTask + 1;
    
    // 各ページのバリデーション
    if (taskPage === 0) { // SUS
      if (sus_result.length !== sus_list.length) {
        alert(`質問紙${taskNum}（SUS）に回答してください。`);
        return;
      }
    } else if (taskPage === 1) { // NASA-TLX
      if (nasa_tlx_result.length !== nasa_tlx_list.length) {
        alert(`質問紙${taskNum}（NASA-TLX）に回答してください。`);
        return;
      }
    } else if (taskPage === 2) { // 商品説明文
      if (!product_description_answer.satisfaction || !product_description_answer.guilt || 
          !product_description_answer.ownership || !product_description_answer.honesty ||
          !product_description_answer.agency) {
        alert(`質問紙${taskNum}（商品説明文）に回答してください。`);
        return;
      }
    } else if (taskPage === 3) { // 管理者確認画面の「次へ」
      // 現在のタスクのデータをFirebaseに送信
      await sendTaskData(currentTask + 1);
      
      // 次のタスクのためにステートをリセット（Task 3でない場合のみ）
      if (currentTask < 2) {
        setNasaTLX([]);
        setSUS([]);
        setProductDescription({
          satisfaction: null,
          guilt: null,
          ownership: null,
          honesty: null,
          agency: null,
        });
      }
    }
    
    setPage((page) => page + 1);
    topref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendTaskData = async (taskNumber: number) => {
    const taskData = {
      task_number: taskNumber,
      nasa_tlx: nasa_tlx_result,
      sus: sus_result,
      product_description: product_description_answer,
      timestamp: new Date(),
    };
    
    // 個別保存
    const doc_id = `${new Date().toISOString()}_task${taskNumber}`;
    try {
      await setDoc(doc(db, "questionnaire_individual", doc_id), {
        user_info: {
          user_id: userinfo_answer.user_id,
          condition: userinfo_answer.condition
        },
        ...taskData,
      });
      console.log(`Task ${taskNumber} data written with ID: `, doc_id);
    } catch (e) {
      console.error(`Error adding task ${taskNumber} document: `, e);
      alert(`タスク${taskNumber}の送信に失敗しました。`);
    }
    
    // タスクデータを蓄積
    setTaskDataStore(prev => [...prev, taskData]);
  };

  const sendAnswer = async () => {
    if (
      nasa_tlx_result.length !== nasa_tlx_list.length ||
      sus_result.length !== sus_list.length ||
      !product_description_answer.satisfaction || !product_description_answer.guilt || 
      !product_description_answer.ownership || !product_description_answer.honesty ||
      !product_description_answer.agency
    ) {
      alert("回答が完了していません。");
      return;
    }
    
    // 最終タスク（タスク3）のデータを個別保存＆蓄積
    await sendTaskData(3);
    
    // 3つのタスクをまとめて統合データとして保存
    const finalDocId = new Date().toISOString();
    const finalTaskData = {
      task_number: 3,
      nasa_tlx: nasa_tlx_result,
      sus: sus_result,
      product_description: product_description_answer,
      timestamp: new Date(),
    };
    
    try {
      await setDoc(doc(db, "questionnaire", finalDocId), {
        user_info: {
          user_id: userinfo_answer.user_id,
          condition: userinfo_answer.condition
        },
        task1: taskDataStore[0] || null,
        task2: taskDataStore[1] || null,
        task3: finalTaskData,
        final_timestamp: new Date(),
      });
      console.log("Final questionnaire data written with ID: ", finalDocId);
    } catch (e) {
      console.error("Error adding final questionnaire document: ", e);
      alert("最終データの送信に失敗しました。");
      return;
    }
    
    navigate("/end");
  };

  const renderSUSQuestions = () => {
    return (
      <>
        <Paper
          style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
        >
          <Typography variant="h5" gutterBottom>
            システム使用性評価（SUS）
          </Typography>
          <Typography variant="body1" paragraph>
            実験中に使用したツールについて以下の質問に回答してください。長時間考えることはせず、各質問文を読んでその場で思ったことを回答してください。
          </Typography>
        </Paper>
        {sus_list.map((sus) => {
          return (
            <Paper
              style={{
                margin: "20px auto",
                padding: "20px",
                maxWidth: "800px",
              }}
              key={sus.id}
            >
              <SUSQuestion {...sus} />
            </Paper>
          );
        })}
      </>
    );
  };

  const renderNasaTLXQuestions = () => {
    return (
      <>
        <Paper
          style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
        >
          <Typography variant="h5" gutterBottom>
            タスク負荷評価（NASA-TLX）
          </Typography>
          <div>
            赤い線を動かして、以下の質問に回答してください。
            <br />
            クリックすると赤い線が現れます。
            ドラッグで赤い線を動かすことも可能です。
          </div>
          <NasaTLXQuestion
            id={-1}
            name="記入例"
            description=""
            min="小さい"
            max="大きい"
          />
        </Paper>
        {nasa_tlx_list.map((nasa_tlx) => {
          return (
            <Paper
              style={{
                margin: "20px auto",
                padding: "20px",
                maxWidth: "800px",
              }}
              key={nasa_tlx.id}
            >
              <NasaTLXQuestion {...nasa_tlx} />
            </Paper>
          );
        })}
      </>
    );
  };

  // 現在のタスク（0, 1, 2）と各タスク内のページ（0-3）を管理
  const currentTask = Math.floor(page / 4); // 0, 1, 2 (タスク1, 2, 3)
  const currentTaskPage = page % 4; // 0-3 (各タスク内のページ)
  
  const pages = [
    // Task 1 (pages 0-3)
    renderSUSQuestions(),          // 0: 質問紙①(1/3)
    renderNasaTLXQuestions(),      // 1: 質問紙①(2/3)
    <ProductDescriptionQuestion />, // 2: 質問紙①(3/3)
    <AdminConfirmation taskNumber={1} />, // 3: 管理者確認画面
    
    // Task 2 (pages 4-7)
    renderSUSQuestions(),          // 4: 質問紙②(1/3)
    renderNasaTLXQuestions(),      // 5: 質問紙②(2/3)
    <ProductDescriptionQuestion />, // 6: 質問紙②(3/3)
    <AdminConfirmation taskNumber={2} />, // 7: 管理者確認画面
    
    // Task 3 (pages 8-11)
    renderSUSQuestions(),          // 8: 質問紙③(1/3)
    renderNasaTLXQuestions(),      // 9: 質問紙③(2/3)
    <ProductDescriptionQuestion />, // 10: 質問紙③(3/3)
    <AdminConfirmation taskNumber={3} />, // 11: 管理者確認画面
  ];

  const getPageTitle = () => {
    const taskNum = currentTask + 1;
    if (currentTaskPage === 3 && currentTask < 2) {
      return `質問紙${taskNum}（完了）`;
    }
    if (currentTaskPage === 3 && currentTask === 2) {
      return `質問紙${taskNum}（送信）`;
    }
    if (currentTaskPage <= 2) {
      return `質問紙${taskNum}（${currentTaskPage + 1}/3）`;
    }
    return `質問紙${taskNum}`;
  };

  const lastPage = pages.length - 1;

  return (
    <Container>
      <Paper
        ref={topref}
        elevation={3}
        style={{
          margin: page == 1 ? "20px auto" : "20px auto",
          padding: "10px",
          maxWidth: "800px",
        }}
      >
        {getPageTitle()}
      </Paper>
      {pages.map((p, i) => {
        return <Page key={i} isShow={page === i}>{p}</Page>;
      })}

      <Divider />
      <div style={{ margin: "20px auto", maxWidth: "800px", display: "flex" }}>
        {page > 0 && page !== 4 && page !== 8 && (
          <Paper
            style={{ margin: "10px", padding: "10px", width: "50%" }}
            onClick={toBeforePage}
          >
            <Button> {"<<"} 前へ</Button>
          </Paper>
        ) || (
          <div style={{ margin: "10px", padding: "10px", width: "50%" }}></div>
        )}
        {page === lastPage ? (
          <Paper style={{ margin: "10px", padding: "10px", width: "50%" }}>
            <Button onClick={sendAnswer}>送信</Button>
          </Paper>
        ) : (
          <Paper
            style={{ margin: "10px", padding: "10px", width: "50%" }}
            onClick={toAfterPage}
          >
            <Button>次へ {">>"}</Button>
          </Paper>
        )}
      </div>
    </Container>
  );
}

const Page: FC<{ isShow: boolean; children: ReactNode }> = ({
  children,
  isShow,
}) => {
  return <div style={{ display: isShow ? "block" : "none" }}>{children}</div>;
};

export default App;
