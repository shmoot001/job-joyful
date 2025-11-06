import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useBusiness } from '@/hooks/useBusiness';
import { AddTransactionDialog } from '@/components/business/AddTransactionDialog';
import { format } from 'date-fns';


export default function Business() {
  const { inTransactions, outTransactions, totalIn, totalOut, isLoading, deleteTransaction } = useBusiness();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const TransactionTable = ({ transactions, type }: { transactions: any[], type: 'IN' | 'OUT' }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {type === 'IN' ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          <h3 className="text-lg font-semibold">
            Total: {type === 'IN' ? totalIn.toFixed(2) : totalOut.toFixed(2)} kr
          </h3>
        </div>
        <AddTransactionDialog type={type} />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead>Pris</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Länk/Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No {type.toLowerCase()} transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.product}</TableCell>
                    <TableCell>{Number(transaction.price).toFixed(2)} kr</TableCell>
                    <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      {transaction.link_order_number && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (transaction.link_order_number.startsWith('http')) {
                              window.open(transaction.link_order_number, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Business Transactions</h1>
            <p className="text-muted-foreground mt-2">Manage your income and expenses</p>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIn.toFixed(2)} kr</div>
            <p className="text-xs text-muted-foreground">{inTransactions.length} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOut.toFixed(2)} kr</div>
            <p className="text-xs text-muted-foreground">{outTransactions.length} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(totalIn - totalOut).toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for IN/OUT */}
      <Tabs defaultValue="in" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="in">Income (IN)</TabsTrigger>
          <TabsTrigger value="out">Expenses (OUT)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="in" className="space-y-4">
          <TransactionTable transactions={inTransactions} type="IN" />
        </TabsContent>
        
        <TabsContent value="out" className="space-y-4">
          <TransactionTable transactions={outTransactions} type="OUT" />
        </TabsContent>
      </Tabs>
    </div>
  );
}