# Questionnaire App

System Userbility Scale [1] と Nasa-TLX [2] のアンケート用Webアプリケーションです。
基本的にGithub Pagesで動作することを前提に作られていますが、設定を変更することで、他のホスティングサイト上でも動作すると思います。

## 使い方

データの保存のためにfirebaseから情報を取得し、`src/firebase.ts` の`firebaseConfig`に必要な情報を記入してください。

また、GitHubのリポジトリ名をbasenameに設定するため、`package.json`の`--base=/naelab-exp-questionnaire/`の部分をリポジトリ名に変更してください。

リポジトリにGitHub Pagesの設定をしてください。

GitHub Actionsを設定しているため、mainブランチにpushすると、正しく設定できていればGitHub Pagesで動作すると思います。

## お願い

本Webアプリケーションを使用した研究を論文として公開する場合、必ず参考文献の2つの論文を引用してください。
また、可能であればサイトのリンク https://github.com/nae-lab/naelab-exp-questionnaire を論文中に記載していただけますと幸いです。

## 参考文献

[1] 佐藤 健斗, 三富 菜々, 昆 恵介, 春名 弘一, 義肢装具領域におけるSystem Usability Scale（SUS）の信頼性の検討, POアカデミージャーナル, 2022, 30 巻, 1 号, p. 32-37, 公開日 2022/06/01, Online ISSN 2434-4060, Print ISSN 0919-8776, https://doi.org/10.32193/jjapo.30.1_32, https://www.jstage.jst.go.jp/article/jjapo/30/1/30_32/_article/-char/ja, 抄録:

[2] 芳賀 繁, 水上 直樹, 日本語版NASA-TLXによるメンタルワークロード測定, 人間工学, 1996, 32 巻, 2 号, p. 71-79, 公開日 2010/03/12, Online ISSN 1884-2844, Print ISSN 0549-4974, https://doi.org/10.5100/jje.32.71, https://www.jstage.jst.go.jp/article/jje1965/32/2/32_2_71/_article/-char/ja, 抄録: 
