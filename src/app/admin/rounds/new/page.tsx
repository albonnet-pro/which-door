import { RoundForm, emptyRound } from "../../round-form";

export default function NewRoundPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold">Nouveau round</h1>
      <RoundForm roundId={null} initial={emptyRound} />
    </>
  );
}
