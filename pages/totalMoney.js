import styles from "./index.module.scss";
import useRate from "./useRate";

export default function totalMoney({ttlMoney,gameNumber}) {

	return (
		<>
			<div className={styles.topColumn}>
				<div className={styles.playNum}>
					<div className={styles.title}>局數<div className={styles.gameSetting}></div></div>
					<div>{gameNumber}</div>
				</div>
				<div className={styles.publicMoney}><img src={"/images/publicMoney.png"}/>{useRate(ttlMoney)}</div>
				<div className={styles.otherMoney}><img src={"/images/otherMoney.png"}/>{useRate(0)}</div>
			</div>
		</>
	)
}