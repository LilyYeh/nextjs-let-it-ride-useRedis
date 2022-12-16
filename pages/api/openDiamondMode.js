import { updateDiamondMode, updateDiamondMoney } from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		const value = JSON.parse(req.body).value;
		await updateDiamondMode(value);
		if(!value){
			await updateDiamondMoney('reset',0)
		}
		res.status(200).json({});
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}