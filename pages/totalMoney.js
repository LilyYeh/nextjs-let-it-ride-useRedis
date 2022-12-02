import styles from "./index.module.scss";
import useRate from "./useRate";

export default function totalMoney({ttlMoney}) {
	return (
		<>
			<div className={styles.topColumn}>
				<div className={styles.playNum}>局數：10</div>
				<div className={styles.publicMoney}><img src={"/images/publicMoney.png"}/>{useRate(ttlMoney)}</div>
				<div className={styles.otherMoney}><img src={"/images/otherMoney.png"}/>{useRate(0)}</div>
			</div>
		</>
	)
}