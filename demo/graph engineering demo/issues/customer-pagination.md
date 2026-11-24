# Customer directory pagination

The customer list shows all matching customers at once. Users should be able to browse large lists one page at a time without losing their search, filters, or sort order.

### **Done when**

- The list opens on page **1** with up to **25 customers**. Users can choose **10, 25, 50, or 100** customers per page.
- Users can navigate with **Previous**, **Next**, and numbered page links. Long page ranges are shortened with ellipses. Previous is disabled on the first page and Next on the last.
- The list shows the current page, total pages, and a range such as **Showing 26–50 of 134 customers**. The controls work with a keyboard, have visible focus, and identify the current page to assistive technology.
- Moving between pages preserves search, filters, and sort order. Changing any of those settings, or the page size, returns to page 1. Reloading or sharing the URL restores the selected page and page size if that page is still available.
- Invalid page settings fall back to their defaults. If a valid page no longer exists, the list shows the last available page. If no customers match, show the existing empty state without pagination controls or a range.
- While loading, replace the previous rows with the existing loading state. Only the latest request can update the list. If it fails, show an inline error with **Retry**.

### How to check

With 134 matching customers at 25 per page, verify that page 2 shows **26–50 of 134** and page 6 shows **126–134 of 134**, with Next disabled. Copy and reopen the page 2 URL. Change the page size, search, filters, and sort from page 2 and verify each returns to page 1. Try invalid parameters, a link to page 99, and a search with no matches. Check keyboard navigation, then simulate a slow request and a failed request to verify that newer results win and Retry works.

### **Work limit**

This feature is for the customer list only. It must not redesign the list or change existing customer actions, search, filters, or sorting.
