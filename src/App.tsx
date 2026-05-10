import { useState } from "react";

export const App = () => {
    const [count, setCount] = useState(0);

    return (
        <>
            <div className={"flex flex-col w-xl m-auto bg-white"}>
                <div> Count: {count} </div>
                <button onClick={() => setCount((n) => n + 1)}> Click </button>
            </div>
        </>
    );
};
