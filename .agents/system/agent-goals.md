# Agent Goals

- Create new goal: Add markdown file to appropriate date directory
- Format: `YYYY/MM/DD_HH_MM_description.md`
- Task status tracking within markdown files
- Cross-repository task coordination and documentation

## Agent Goals Workflow

- This is written by human and initially status is TODO.
- The user then asks AI to implement the feature by feature description
- AI first find the task and changes its status to IN_PROGRESS
- The AI then implements the feature by creating the necessary files and directories.
- Once AI finishes implement the feature, it should change the status to DONE.
- The AI should also add a section called ## Agent Report outling all the possble changes made in the md file. Please add timestamp of when this report was filed and total time it took to implement this feature
