import { useState } from "react";
import { Button } from "@/components/ui/button";

export const App = () => {
    const [count, setCount] = useState(0);

    return (
        <>
            <div className={"flex flex-col w-xl m-auto bg-white"}>
                <div> Count: {count} </div>
                <Button onClick={() => setCount((n) => n + 1)}> Click </Button>
            </div>
        </>
    );
};
