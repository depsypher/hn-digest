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
let getBooleanInputMock: jest.SpiedFunction<typeof core.getBooleanInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

describe("action", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        errorMock = jest.spyOn(core, "error").mockImplementation();
        getInputMock = jest.spyOn(core, "getInput").mockImplementation();
        getBooleanInputMock = jest
            .spyOn(core, "getBooleanInput")
            .mockImplementation();
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
                case "mailgun-domain":
                    return process.env.INPUT_MAILGUN_DOMAIN as string;
                case "mailgun-key":
                    return process.env.INPUT_MAILGUN_KEY as string;
                default:
                    return "";
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getBooleanInputMock.mockImplementation((name) => {
            return false;
        });

        await main.run();
        expect(runMock).toHaveReturned();
        expect(errorMock).not.toHaveBeenCalled();
        expect(setFailedMock).not.toHaveBeenCalled();
    }, 60_000);
});
