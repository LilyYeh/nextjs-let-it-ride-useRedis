import styles from "./index.module.scss";

export default function gameLoginFail() {
	return (
		<>
			<div className={`${styles.loginFail} ${styles.waitingText}`}>您已於此裝置登入遊戲</div>
		</>
	)
}