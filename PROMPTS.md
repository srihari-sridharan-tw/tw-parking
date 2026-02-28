# Feature & Fix Prompts (Post-Specification)

All prompts given after the initial Slotify specification, in order.

---

1. **Free Up all slots** — Add a "Free Up!" button on the admin report screen to force check out all currently occupied slots.

2. **Users list + Clear Employees** — Add a screen for the admin to view all registered users. Add a "Clear All Employees" feature that removes all employee accounts (leaving admin and security users intact).

3. **Security flag screen — tile view** — For the security user, replace the search-based slot picker with a tile-based display showing all slots. Used slots should display the vehicle number and be disabled. Empty slots should allow the security user to tap and enter a vehicle number to flag an unauthorised vehicle.

4. **Bug: tiles not showing** — Tiles were not appearing on the security flag screen (screenshot provided).

5. **Bug: occupied slot shown as empty** — Occupied slots were incorrectly displayed as empty on the security flag screen (screenshot provided).

6. **Flagged slot status** — After flagging a slot, the tile should show the flagged vehicle number and display a "Flagged" status.

7. **Bug: admin resolve not working** — Clicking "Resolve" on the admin flags screen was not resolving the flagged status (screenshot provided).

8. **Dark mode and light mode support** — Add full dark mode and light mode support across the entire UI.

9. **Manual theme toggle** — Add a way to switch between light and dark modes manually.

10. **Bug: dark mode toggle error** — Uncaught Error: "Unable to manually set color scheme without using darkMode: class" (screenshot provided).

11. **Password confirmation for Clear All Employees** — When the admin taps "Clear All Employees", prompt them to enter their password before the operation proceeds.

12. **Bug: wrong password logs out admin** — If the admin enters an incorrect password on the Clear All Employees confirmation, it was logging them out. It should show an invalid password error instead.

13. **Password confirmation for Free Up** — Add the same admin password confirmation to the "Free Up!" (force checkout all) feature.

14. **List / grid view toggle** — Add a toggle to switch between list view and grid (tile) view on the admin slots screen and the employee available slots screen.

15. **Slot type emojis** — Use a motorbike emoji (🏍️) for TWO_WHEELER and a car emoji (🚗) for FOUR_WHEELER instead of text labels.

16. **Emoji-only badges** — Remove the "2W" / "4W" text from the type badges and make the emoji slightly larger.
