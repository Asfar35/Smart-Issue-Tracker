import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import SimilarIssuesDialog from './SimilarIssuesDialog';

export default function CreateIssue({ onIssueCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [similarIssues, setSimilarIssues] = useState([]);
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);

  const checkSimilarIssues = async (searchTitle) => {
    if (!searchTitle || searchTitle.length < 3) return [];

    const titleWords = searchTitle.toLowerCase().split(' ').filter(word => word.length > 2);
    const issuesRef = collection(db, 'issues');
    const querySnapshot = await getDocs(issuesRef);
    
    const similar = [];
    querySnapshot.forEach((doc) => {
      const issue = doc.data();
      const issueTitle = issue.title.toLowerCase();
      
      const matchCount = titleWords.filter(word => issueTitle.includes(word)).length;
      const similarity = matchCount / titleWords.length;
      
      if (similarity > 0.4) {
        similar.push({ id: doc.id, ...issue, similarity });
      }
    });

    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const similar = await checkSimilarIssues(title);
      
      if (similar.length > 0) {
        setSimilarIssues(similar);
        setShowSimilarDialog(true);
        setLoading(false);
        return;
      }

      await createIssue();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create issue');
      setLoading(false);
    }
  };

  const createIssue = async () => {
    try {
      await addDoc(collection(db, 'issues'), {
        title,
        description,
        priority,
        status: 'Open',
        assignedTo,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.email,
      });

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssignedTo('');
      setShowSimilarDialog(false);
      onIssueCreated();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create New Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Detailed explanation of the issue"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Input
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                  placeholder="Email or name"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Issue'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <SimilarIssuesDialog
        isOpen={showSimilarDialog}
        onClose={() => {
          setShowSimilarDialog(false);
          setLoading(false);
        }}
        similarIssues={similarIssues}
        onProceed={createIssue}
      />
    </>
  );
}
