# Saturday Demo Script

**Goal:** show a real system executing, auditing, and scaling without over-explaining.

## Setup
- Open: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`
- Leave API Key empty.
- Tenant Surface: `ownerfi / OwnerFi`

## Five-Minute Flow
1. Click **Run Full Flow**.
2. Say: "This is a live SentinelOS surface executing the OwnerFi workflow."
3. Point to:
   - Application Submitted
   - Decision
   - Deal
   - Audit Trail
4. Point to **Command History**.
5. Click **Replay Last Workflow** once.
6. Switch Tenant Surface to `hotelops / HotelOps`.
7. Say: "This is the same system model. HotelOps is registered as another surface plane, but its workflow is not installed yet."
8. Stop and let them ask.

## Ownership Answer
"You fully own OwnerFi: brand, workflows, customers, and data. SentinelOS is the system layer underneath it so the company can scale without rebuilding the engine later."

## Governed Block Moment
Use only if the conversation turns to control, risk, or trust.

Say: "The system will block execution if risk is high, even if everything else is working."

Then show the pending approval and stop. Do not approve it in the room.

Reference: [Governed Block Demo Moment](./GOVERNED_BLOCK_DEMO_MOMENT.md)

## Do Not Do
- do not open Azure unless asked
- do not use the API key in the room unless asked for live protected proof
- do not approve or reject the pending high-risk approval in the room
- do not add new features during the meeting
- do not over-explain the architecture before they see it run
