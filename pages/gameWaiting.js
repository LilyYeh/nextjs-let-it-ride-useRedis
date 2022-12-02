import styles from "./index.module.scss";

export default function gameWaiting() {
	return (
		<>
			<div className={`${styles.waiting} ${styles.waitingText}`}>遊戲進行中，請稍候</div>
		</>
	)
}