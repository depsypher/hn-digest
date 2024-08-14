/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from "@actions/core";
import * as main from "../src/main";

// Mock the action's main function
const runMock = jest.spyOn(main, "run");

// Mock the GitHub Actions core library
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

describe("action", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        errorMock = jest.spyOn(core, "error").mockImplementation();
        getInputMock = jest.spyOn(core, "getInput").mockImplementation();
        setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();
    });

    it("fetches top hn stories", async () => {
        // Set the action's inputs as return values from core.getInput()
        getInputMock.mockImplementation((name) => {
            switch (name) {
                case "pg-user":
                    return process.env.INPUT_PG_USER as string;
                case "pg-password":
                    return process.env.INPUT_PG_PASSWORD as string;
                case "pg-host":
                    return process.env.INPUT_PG_HOST as string;
                case "pg-database":
                    return process.env.INPUT_PG_DATABASE as string;
                case "mode":
                    return "collect";
                default:
                    return "";
            }
        });

        await main.run();
        expect(runMock).toHaveReturned();
        expect(errorMock).not.toHaveBeenCalled();
        expect(setFailedMock).not.toHaveBeenCalled();
    });
});
