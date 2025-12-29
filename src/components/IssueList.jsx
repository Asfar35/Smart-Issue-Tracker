import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

export default function IssueList({ refresh }) {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusError, setStatusError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, [refresh]);

  useEffect(() => {
    applyFilters();
  }, [issues, statusFilter, priorityFilter]);

  const fetchIssues = async () => {
    try {
      const issuesRef = collection(db, 'issues');
      const q = query(issuesRef);
      const querySnapshot = await getDocs(q);
      
      const issuesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      issuesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setIssues(issuesList);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...issues];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    setFilteredIssues(filtered);
  };

  const validateStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === 'Open' && newStatus === 'Done') {
      return {
        valid: false,
        message: 'Cannot move directly from Open to Done',
        description: 'Please move the issue to "In Progress" first before marking it as Done.'
      };
    }
    return { valid: true };
  };

  const handleStatusChange = async (issueId, issue, newStatus) => {
    const validation = validateStatusTransition(issue.status, newStatus);
    
    if (!validation.valid) {
      setStatusError({
        issueId,
        message: validation.message,
        description: validation.description
      });
      return;
    }

    try {
      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, { status: newStatus });
      fetchIssues();
      setStatusError(null);
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusError({
        issueId,
        message: 'Failed to update status',
        description: error.message
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'default';
      case 'In Progress': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading issues...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <Label>Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label>Filter by Priority</Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {statusError && (
        <Alert variant="destructive" className="relative">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{statusError.message}</AlertTitle>
          <AlertDescription>{statusError.description}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setStatusError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <div className="grid gap-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No issues found
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card 
              key={issue.id}
              className={statusError?.issueId === issue.id ? 'border-destructive' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{issue.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Select
                      value={issue.status}
                      onValueChange={(value) => handleStatusChange(issue.id, issue, value)}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <Badge variant={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{issue.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-medium">Assigned to:</span>{' '}
                    <span className="text-muted-foreground">{issue.assignedTo}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created by:</span>{' '}
                    <span className="text-muted-foreground">{issue.createdBy}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    <span className="text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
