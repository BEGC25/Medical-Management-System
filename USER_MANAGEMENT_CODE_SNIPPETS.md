# User Management - Key Code Snippets

## Password Strength Indicator Implementation

```typescript
// Password strength calculator
function getPasswordStrength(password: string): { strength: 'weak' | 'medium' | 'strong', score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) return { strength: 'weak', score: 33 };
  if (score <= 3) return { strength: 'medium', score: 66 };
  return { strength: 'strong', score: 100 };
}

// In the form (UI)
{passwordStrength && (
  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Password Strength</span>
      <span className={cn(
        "font-medium capitalize",
        passwordStrength.strength === 'weak' && "text-red-600",
        passwordStrength.strength === 'medium' && "text-yellow-600",
        passwordStrength.strength === 'strong' && "text-green-600"
      )}>
        {passwordStrength.strength}
      </span>
    </div>
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full transition-all duration-500 ease-out",
          passwordStrength.strength === 'weak' && "bg-red-500",
          passwordStrength.strength === 'medium' && "bg-yellow-500",
          passwordStrength.strength === 'strong' && "bg-green-500"
        )}
        style={{ width: `${passwordStrength.score}%` }}
      />
    </div>
    <p className="text-xs text-muted-foreground">
      Use 10+ characters with mix of letters, numbers & symbols
    </p>
  </div>
)}
```

## Search and Filter Logic

```typescript
// Filter, search, and sort users with memoization
const filteredAndSortedUsers = useMemo(() => {
  if (!users) return [];
  
  let filtered = [...users];
  
  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((u: any) => 
      u.username?.toLowerCase().includes(query) ||
      u.fullName?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  }
  
  // Sort logic with null handling
  if (sortField && sortDirection) {
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      // Handle dates
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle strings (case-insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  return filtered;
}, [users, searchQuery, sortField, sortDirection]);

// Pagination
const paginatedUsers = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;
  return filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);
}, [filteredAndSortedUsers, currentPage, pageSize]);
```

## Stats Dashboard

```typescript
// Calculate stats from users
const stats = useMemo(() => {
  if (!users) return null;
  
  const totalUsers = users.length;
  const roleBreakdown = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  
  // Recently added (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyAdded = users.filter((u: any) => 
    new Date(u.createdAt) > sevenDaysAgo
  ).length;
  
  return { totalUsers, roleBreakdown, recentlyAdded };
}, [users]);

// Stats Card UI
<Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-blue-500">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
          {stats.totalUsers}
        </p>
      </div>
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  </CardContent>
</Card>
```

## Sortable Column Headers

```typescript
// Three-state sort handler
const handleSort = (field: SortField) => {
  if (sortField === field) {
    if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection(null);
      setSortField('createdAt'); // Reset to default
    } else {
      setSortDirection('asc');
    }
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
  setCurrentPage(1); // Reset to first page when sorting
};

// Sortable header UI
<TableHead className="font-semibold">
  <button
    onClick={() => handleSort('username')}
    className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
  >
    <span>Username</span>
    <div className="flex flex-col">
      {sortField === 'username' && sortDirection === 'asc' ? (
        <ArrowUp className="h-4 w-4 text-primary" />
      ) : sortField === 'username' && sortDirection === 'desc' ? (
        <ArrowDown className="h-4 w-4 text-primary" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      )}
    </div>
  </button>
</TableHead>
```

## Action Buttons with Tooltips

```typescript
// Edit button with tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleEditUser(u)}
      className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 
                 hover:text-blue-600 dark:hover:text-blue-400 
                 transition-all duration-200 hover:scale-110"
    >
      <Edit className="w-4 h-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="top" className="animate-in fade-in-0 zoom-in-95 duration-200">
    <p>Edit user details</p>
  </TooltipContent>
</Tooltip>

// Delete button with confirmation and tooltip
<AlertDialog>
  <Tooltip>
    <TooltipTrigger asChild>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={u.id === user?.id}
          className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 
                     hover:text-red-600 dark:hover:text-red-400 
                     transition-all duration-200 hover:scale-110 
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     disabled:hover:scale-100"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>{u.id === user?.id ? "Cannot delete yourself" : "Delete user"}</p>
    </TooltipContent>
  </Tooltip>
  <AlertDialogContent className="animate-in fade-in-0 zoom-in-95 duration-300">
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        Delete User
      </AlertDialogTitle>
      <AlertDialogDescription className="text-base">
        Are you sure you want to delete <strong>{u.username}</strong>? 
        <br />
        <span className="text-red-600 font-medium">This action cannot be undone.</span>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => deleteMutation.mutate(u.id)}
        className="bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Pagination Component

```typescript
{totalPages > 1 && (
  <div className="flex items-center justify-between px-2">
    <div className="text-sm text-muted-foreground">
      Page {currentPage} of {totalPages}
    </div>
    <Pagination>
      <PaginationContent>
        {/* Previous Button */}
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="gap-1 transition-all duration-200 hover:scale-105"
          >
            <PaginationPrevious className="h-4 w-4" />
          </Button>
        </PaginationItem>

        {/* Page Numbers with ellipsis */}
        {[...Array(totalPages)].map((_, i) => {
          const pageNum = i + 1;
          // Smart display: first, last, current +/- 1
          if (
            pageNum === 1 ||
            pageNum === totalPages ||
            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
          ) {
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => setCurrentPage(pageNum)}
                  isActive={currentPage === pageNum}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    currentPage === pageNum 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:scale-110"
                  )}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          } else if (
            pageNum === currentPage - 2 ||
            pageNum === currentPage + 2
          ) {
            return (
              <PaginationItem key={pageNum}>
                <span className="flex h-9 w-9 items-center justify-center">...</span>
              </PaginationItem>
            );
          }
          return null;
        })}

        {/* Next Button */}
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="gap-1 transition-all duration-200 hover:scale-105"
          >
            <PaginationNext className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
)}
```

## Empty States

```typescript
// No users or no search results
{filteredAndSortedUsers.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center 
                  animate-in fade-in-0 zoom-in-95 duration-500">
    <div className="p-4 bg-muted/50 rounded-full mb-4">
      {searchQuery ? (
        <Search className="h-12 w-12 text-muted-foreground" />
      ) : (
        <Users className="h-12 w-12 text-muted-foreground" />
      )}
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {searchQuery ? "No users found" : "No users yet"}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      {searchQuery 
        ? `No users match "${searchQuery}". Try adjusting your search.`
        : "Get started by creating your first user account."
      }
    </p>
    {!searchQuery && (
      <Button onClick={() => setCreateOpen(true)} 
              className="shadow-md hover:shadow-lg transition-all">
        <UserPlus className="w-4 h-4 mr-2" />
        Create First User
      </Button>
    )}
  </div>
)}
```

## Skeleton Loading State

```typescript
// Premium skeleton with shimmer
{isLoading && (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg 
                               bg-muted/30 animate-pulse">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
)}
```

## Form Validation with Icons

```typescript
// Username field with icon and validation
<div className="space-y-2">
  <Label htmlFor="new-username" className="text-sm font-medium">Username</Label>
  <div className="relative">
    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      id="new-username"
      type="text"
      value={newUser.username}
      onChange={(e) => {
        setNewUser({ ...newUser, username: e.target.value });
        if (formErrors.username) {
          setFormErrors(prev => ({ ...prev, username: '' }));
        }
      }}
      className={cn(
        "pl-10 transition-all duration-200",
        formErrors.username && "border-red-500 focus-visible:ring-red-500"
      )}
      placeholder="Enter username"
      required
    />
  </div>
  {formErrors.username && (
    <div className="flex items-center gap-1 text-xs text-red-600 
                    animate-in fade-in-0 slide-in-from-top-1">
      <AlertCircle className="h-3 w-3" />
      <span>{formErrors.username}</span>
    </div>
  )}
</div>
```

## Enhanced Table Row with Avatar and Role Badge

```typescript
<TableRow 
  key={u.id} 
  className={cn(
    "transition-all duration-200 group",
    "hover:bg-muted/50 hover:shadow-sm",
    index % 2 === 0 ? "bg-background" : "bg-muted/20"
  )}
>
  {/* Username with avatar */}
  <TableCell className="font-medium">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center 
                      justify-center text-primary font-semibold text-sm">
        {u.username.charAt(0).toUpperCase()}
      </div>
      {u.username}
    </div>
  </TableCell>
  
  {/* Role with icon badge */}
  <TableCell>
    <span className="capitalize inline-flex items-center gap-1.5 px-2.5 py-1 
                     rounded-full text-xs font-semibold bg-blue-100 text-blue-800 
                     border border-blue-200 shadow-sm dark:bg-blue-900 
                     dark:text-blue-200 dark:border-blue-800 transition-all 
                     duration-200 group-hover:shadow-md">
      {getRoleIcon(u.role)}
      {u.role}
    </span>
  </TableCell>
</TableRow>
```
