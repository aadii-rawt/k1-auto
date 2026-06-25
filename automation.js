
const getWithdrawDetails = async (websiteA) => {
    const accountNumber = await websiteA.locator(
        'p:text("Account Number :-")'
    ).locator('xpath=following-sibling::p[1]')
        .textContent();
    const ifsc = await websiteA.locator(
        'p:text("IFSC")'
    ).locator('xpath=following-sibling::p[1]')
        .textContent();
    const name = await websiteA.locator(
        'p:text("Holder Name :-")'
    ).locator('xpath=following-sibling::p[1]')
        .textContent();
    const amount = await websiteA.locator(
        'p:text("Amount :-")'
    ).locator('xpath=following-sibling::p[1]')
        .textContent();

    return { accountNumber, ifsc, name, amount }
}

const { chromium } = require("playwright");

module.exports = async (
    window,
    config,
    log,
    isRunning
) => {

    const minWithdrawAmount = config.minAmount;
    const maxWithdrawAmount = config.maxAmount;

    log(`Min Amount: ${minWithdrawAmount}`);
    log(`Max Amount: ${maxWithdrawAmount}`);


    if (!config.mpin || config.mpin.length !== 4) {

        sendLog("Invalid MPIN.");

        return;

    }



    const browser = await chromium.connectOverCDP(
        "http://127.0.0.1:9222"
    );


    const context = browser.contexts()[0];

    const pages = context.pages();

    const websiteA = pages[0];
    const websiteB = pages[1];

    // end process is approved trasaction open
    if (await websiteA.getByText("Approved Amount").isVisible().catch(() => false)) {
        log("Approved Amount found");
        return;;
    }


    let utr;


    try {

        await websiteA.bringToFront();

        let rowIndex = 0;

        while (isRunning()) {

            const rows = websiteA.locator(".details-notes-cmn-img");

            const count = await rows.count();

            if (rowIndex >= count) {
                log("No more eligible rows");
                return;;
                break;
            }

            await rows.nth(rowIndex).click();
            const { accountNumber, ifsc, name, amount } = await getWithdrawDetails(websiteA);
            log(
                `Account: ${accountNumber} | ${name} | ₹${amount} | Row: ${rowIndex}`
            );
            // const accountNumber = "5750838958";
            // const ifsc = "KKBK0000173";
            // const name = "Aditya Rawat";
            // const amount = "100";

            if (amount < minWithdrawAmount || amount > maxWithdrawAmount) {
                log("Skipping");
                await websiteA.locator(".btn-close").first().click()
                rowIndex++;
                continue;
            }


            // dummmy account details comment the real one 


            // switch to k1 
            await websiteB.bringToFront();

            // check if the beneficiary already exist or not 
            const isAccountExist = async () => {

                const searchInput = websiteB.locator("#txtSearchF");
                await searchInput.click();

                await searchInput.clear(); // Clear previous search

                await searchInput.pressSequentially(
                    accountNumber,
                    { delay: 50 }
                );

                // Give search time to load results
                await websiteB.waitForTimeout(2000);
                const impsButton = websiteB.getByRole("button", {
                    name: "IMPS"
                });

                const exists = await impsButton.count();

                log("IMPS count:", exists);

                if (exists === 0) {
                    return false;
                }

                return true;
            };

            let beneficiaryExists = await isAccountExist();

            // add beneficiary if not exist
            if (!beneficiaryExists) {
                log("Beneficiary not found");

                await websiteB.getByText("Add New").click();

                await websiteB
                    .locator("#ContentPlaceHolder1_txtAddBAccountNo")
                    .fill(accountNumber);

                await websiteB
                    .locator("#ContentPlaceHolder1_txtAddBIFSC")
                    .fill(ifsc);

                await websiteB
                    .locator("#txtAddBName")
                    .fill(name);

                // api request to add account
                const createAccountResponse = websiteB.waitForResponse(res =>
                    res.url().includes("/Member/SafeDMT.aspx") &&
                    res.status() === 200
                );

                await websiteB
                    .locator("#ContentPlaceHolder1_btnAddBeneficiary")
                    .click();

                await createAccountResponse; // move to next task only when account added. 

                await websiteB.locator(".ajs-ok").click();
                log("Account added");

                await websiteB.waitForTimeout(3000);

                beneficiaryExists = await isAccountExist();
            }


            if (beneficiaryExists) {
                log("Beneficiary exists");

                log(amount);

                // await createPayment();

                // const amountInput =  websiteB.locator("#txtAmount");
                // await amountInput.click();
                // await amountInput.clear()
                // await amountInput.fill(amount); 

                // await websiteB
                //     .ge("#txtAmount")
                //     .first()
                //     .fill(amount); // use your amount variable

                const row = websiteB
                    .getByRole("button", { name: "IMPS" })
                    .locator("xpath=ancestor::tr");

                await row
                    .locator("#txtAmount")
                    .fill(amount);

                await websiteB
                    .getByRole("button", {
                        name: "IMPS"
                    })
                    .click();


                try {

                    await websiteB
                        .locator("#ContentPlaceHolder1_txtTPin")
                        .first()
                        .fill(config.mpin);

                    try {

                        log("before payment successfull");
                        const confrimWithdrawResponse = websiteB.waitForResponse(res =>
                            res.url().includes("/Member/SafeDMT.aspx") &&
                            res.status() === 200
                        );

                        await websiteB.getByText("CONFIRM").click()

                        await confrimWithdrawResponse; // move to next task when payment done. 
                        log("after payment successfull");
                    } catch (error) {
                        log("payment failed ", error);
                        return;;
                    }


                    // const invalidPinMessage = websiteB.getByText(
                    //     "Please enter right Login Pin"
                    // );
                    // if (await invalidPinMessage.isVisible().catch(() => false)) {
                    //     log("Invalid MPIN");
                    //     return;;
                    // }
                    log("payment successfull");

                    const transactionTable =
                        websiteB.locator("table").filter({
                            hasText: "TID"
                        });

                    const utrWithString = await transactionTable
                        .locator("tbody tr")
                        .first()
                        .locator("td")
                        .nth(0)
                        .textContent();

                    utr = utrWithString.replace(/\D/g, "");

                    log(utr);
                    await websiteB.getByText("Back").click()
                } catch (error) {
                    return;;
                }

            } else {
                log("Beneficiary still not found after adding");
            }

            // submit utr 

            await websiteA.bringToFront()
            if (!utr) {
                log("no utr found", utr);
                return;
            }

            // // apporve the withdraw with utr
            await websiteA.locator(".btn-close").first().click()

            try {
                log("before modal open");

                // const modalOpenResponse = websiteB.waitForResponse(res =>
                //     res.url().includes("/transaction/transaction-client-details") &&
                //     res.status() === 200
                // );
                await websiteA.getByTitle("Approve").nth(rowIndex).click()

                // await modalOpenResponse()
                log("log after modal open");
            } catch (error) {
                log("can not open modal", error);
                return;

            }

            await websiteB.waitForTimeout(3000);

            await websiteA.locator(
                'label:text("UTR Number")'
            ).locator('xpath=following-sibling::input[1]').fill(utr)

            try {
                // log("before withdraw approve");
                // const paymentApproveResponse = websiteB.waitForResponse(res =>
                //     res.url().includes("/transaction/update-transaction-request-v2") &&
                //     res.status() === 200
                // );

                await websiteA
                    .locator(".accept-footer-btn")
                    .locator("button")
                    .nth(1)
                    .click();
                // await paymentApproveResponse();
                log("after payment approve");


            } catch (error) {
                log("withdraw approve failed ", error);
                return;

            }


            await websiteA.waitForTimeout(4000)
            log("withdra complete ");


            // // click on the submit button

            // // cancel temp
            // // await websiteA.getByText("Cancel").first().click()
            // log("done");

            // return;;


        }

    } catch (error) {
        log(error);
        return;;
    }

}


